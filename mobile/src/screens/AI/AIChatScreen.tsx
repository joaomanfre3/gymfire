'use strict';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import api from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
}

interface ParsedWorkout {
  nome: string;
  exercicios: Array<{ nome: string; series: number; reps: number; descanso: number }>;
}

interface ParsedWeeklyPlan {
  tipo: 'semanal';
  nome: string;
  treinos: ParsedWorkout[];
}

type ParsedAIWorkout = ParsedWorkout | ParsedWeeklyPlan;

function isWeeklyPlan(data: ParsedAIWorkout): data is ParsedWeeklyPlan {
  return 'tipo' in data && data.tipo === 'semanal';
}

function parseWorkoutJSON(content: string): ParsedAIWorkout | null {
  const match = content.match(/---TREINO_JSON---\s*([\s\S]*?)\s*---FIM_JSON---/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (data.tipo === 'semanal' && Array.isArray(data.treinos)) return data;
    if (data.nome && Array.isArray(data.exercicios)) return data;
  } catch {}
  return null;
}

function cleanContent(content: string): string {
  return content.replace(/---TREINO_JSON---[\s\S]*?---FIM_JSON---/, '').trim();
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [convId, setConvId] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState<Array<{ id: string; name: string }>>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  async function loadUsage() {
    try {
      const { data } = await api.get('/ai/usage');
      setUsage(data);
    } catch {}
  }

  async function ensureConversation(): Promise<string> {
    if (convId) return convId;
    try {
      const { data } = await api.post('/ai/conversations', {});
      setConvId(data.id);
      return data.id;
    } catch {
      throw new Error('Falha ao criar conversa');
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamText('');

    try {
      const cId = await ensureConversation();
      const token = await AsyncStorage.getItem('access_token');

      const response = await fetch(
        `https://gymfire-spmt.vercel.app/api/ai/conversations/${cId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: text }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro' }));
        throw new Error(err.error || 'Erro na resposta');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Sem stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              accumulated += data.content;
              setStreamText(accumulated);
            }
            if (data.done) {
              const finalContent = data.fullContent || accumulated;
              const aiMsg: AIMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: finalContent,
                createdAt: new Date().toISOString(),
              };
              setMessages(prev => [...prev, aiMsg]);
              setStreamText('');
              loadUsage();
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro interno';
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: `Erro: ${errorMsg}`, createdAt: new Date().toISOString() },
      ]);
      setStreamText('');
    }

    setStreaming(false);
  }, [input, streaming, convId]);

  async function handleSaveWorkout(workout: ParsedAIWorkout) {
    try {
      const { data: routineList } = await api.get('/routines');
      setRoutines(Array.isArray(routineList) ? routineList : []);
    } catch {}

    const isWeekly = isWeeklyPlan(workout);
    const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Nova Rotina',
        onPress: () => {
          Alert.prompt?.(
            'Nome da Rotina',
            'Digite o nome para a nova rotina:',
            async (name) => {
              if (!name?.trim()) return;
              try {
                const payload: Record<string, unknown> = { nome: name.trim() };
                if (isWeekly) payload.treinos = workout.treinos;
                else payload.exercicios = (workout as ParsedWorkout).exercicios;
                await api.post('/ai/save-workout', payload);
                Alert.alert('Sucesso', `Rotina "${name}" criada!`);
              } catch {
                Alert.alert('Erro', 'Falha ao salvar rotina.');
              }
            },
            'plain-text',
            workout.nome,
          ) ?? saveWithName(workout);
        },
      },
    ];

    // Add existing routines
    if (routines.length > 0) {
      buttons.push({
        text: 'Rotina Existente',
        onPress: () => showRoutineSelector(workout),
      });
    }

    Alert.alert(
      'Salvar Treino',
      isWeekly
        ? `${(workout as ParsedWeeklyPlan).treinos.length} treinos gerados pela IA`
        : `${(workout as ParsedWorkout).exercicios.length} exercícios`,
      buttons,
    );
  }

  function saveWithName(workout: ParsedAIWorkout) {
    // Fallback for platforms without Alert.prompt
    const isWeekly = isWeeklyPlan(workout);
    const payload: Record<string, unknown> = { nome: workout.nome };
    if (isWeekly) payload.treinos = workout.treinos;
    else payload.exercicios = (workout as ParsedWorkout).exercicios;

    api.post('/ai/save-workout', payload)
      .then(() => Alert.alert('Sucesso', `Rotina "${workout.nome}" criada!`))
      .catch(() => Alert.alert('Erro', 'Falha ao salvar rotina.'));
  }

  function showRoutineSelector(workout: ParsedAIWorkout) {
    const buttons = routines.map(r => ({
      text: r.name,
      onPress: () => {
        Alert.alert(
          'Substituir ou Adicionar?',
          `Deseja substituir os treinos de "${r.name}" ou adicionar ao final?`,
          [
            { text: 'Cancelar', style: 'cancel' as const },
            {
              text: 'Adicionar',
              onPress: async () => {
                try {
                  const payload: Record<string, unknown> = { nome: workout.nome, routineId: r.id };
                  if (isWeeklyPlan(workout)) payload.treinos = workout.treinos;
                  else payload.exercicios = (workout as ParsedWorkout).exercicios;
                  await api.post('/ai/save-workout', payload);
                  Alert.alert('Sucesso', 'Exercícios adicionados!');
                } catch { Alert.alert('Erro', 'Falha ao salvar.'); }
              },
            },
            {
              text: 'Substituir',
              style: 'destructive' as const,
              onPress: async () => {
                try {
                  const payload: Record<string, unknown> = { nome: workout.nome, routineId: r.id, replace: true };
                  if (isWeeklyPlan(workout)) payload.treinos = workout.treinos;
                  else payload.exercicios = (workout as ParsedWorkout).exercicios;
                  await api.post('/ai/save-workout', payload);
                  Alert.alert('Sucesso', 'Rotina substituída!');
                } catch { Alert.alert('Erro', 'Falha ao salvar.'); }
              },
            },
          ],
        );
      },
    }));
    buttons.push({ text: 'Cancelar', onPress: () => {} });
    Alert.alert('Selecionar Rotina', 'Escolha uma rotina:', buttons as any);
  }

  function newConversation() {
    setConvId(null);
    setMessages([]);
    setStreamText('');
  }

  const renderMessage = ({ item }: { item: AIMessage }) => {
    const isUser = item.role === 'user';
    const parsedWorkout = !isUser ? parseWorkoutJSON(item.content) : null;
    const displayText = !isUser ? cleanContent(item.content) : item.content;

    return (
      <View style={{ marginBottom: 12 }}>
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.msgText, isUser && { color: colors.textInverse }]}>
            {displayText}
          </Text>
          <Text style={[styles.msgTime, isUser && { color: 'rgba(10,10,15,0.4)' }]}>
            {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Workout action buttons */}
        {parsedWorkout && !isWeeklyPlan(parsedWorkout) && (
          <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveWorkout(parsedWorkout)}>
            <Ionicons name="save-outline" size={16} color={colors.textInverse} />
            <Text style={styles.saveBtnText}>Adicionar à Rotina</Text>
          </TouchableOpacity>
        )}

        {parsedWorkout && isWeeklyPlan(parsedWorkout) && (
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyTitle}>{parsedWorkout.treinos.length} treinos gerados</Text>
            {parsedWorkout.treinos.map((t, i) => (
              <View key={i} style={styles.weeklyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weeklyName}>{t.nome}</Text>
                  <Text style={styles.weeklyCount}>{t.exercicios.length} exercícios</Text>
                </View>
                <TouchableOpacity
                  style={styles.weeklyAddBtn}
                  onPress={() => handleSaveWorkout(t)}
                >
                  <Text style={styles.weeklyAddText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveWorkout(parsedWorkout)}>
              <Ionicons name="save-outline" size={16} color={colors.textInverse} />
              <Text style={styles.saveBtnText}>Adicionar Rotina Completa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const suggestions = [
    'Monta um treino de peito',
    'Plano semanal Push Pull Legs',
    'Dicas para iniciantes',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>GymFire AI</Text>
          <Text style={styles.headerSub}>Seu personal trainer virtual</Text>
        </View>
        {usage && (
          <View style={styles.usageBadge}>
            <Text style={styles.usageText}>{usage.remaining}/{usage.limit}</Text>
          </View>
        )}
        <TouchableOpacity onPress={newConversation} style={{ marginLeft: 10, padding: 6 }}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 && !streaming ? (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles" size={48} color={colors.surfaceLight} />
          <Text style={styles.emptyTitle}>Olá! Sou o GymFire AI</Text>
          <Text style={styles.emptyDesc}>
            Tire dúvidas sobre exercícios, peça treinos personalizados e muito mais.
          </Text>
          <View style={styles.suggestions}>
            {suggestions.map(s => (
              <TouchableOpacity key={s} style={styles.suggestionBtn} onPress={() => setInput(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            streaming && streamText ? (
              <View style={[styles.msgBubble, styles.aiBubble]}>
                <Text style={styles.msgText}>{cleanContent(streamText)}</Text>
                <View style={styles.typingDot} />
              </View>
            ) : streaming ? (
              <View style={{ padding: 12, alignItems: 'flex-start' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte algo sobre fitness..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          editable={!streaming}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || streaming) && { opacity: 0.4 }]}
          onPress={sendMessage}
          disabled={!input.trim() || streaming}
        >
          <Ionicons name="send" size={20} color={input.trim() ? colors.textInverse : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  usageBadge: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  usageText: { fontSize: 12, fontWeight: '700', color: colors.textInverse },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' },
  suggestionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  suggestionText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  msgBubble: { maxWidth: '85%', padding: 12, borderRadius: 18 },
  userBubble: {
    backgroundColor: colors.primary, alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  msgTime: { fontSize: 9, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginTop: 6,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', marginTop: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.primary,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
  weeklyCard: {
    marginTop: 8, padding: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  weeklyTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  weeklyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  weeklyName: { fontSize: 13, fontWeight: '600', color: colors.text },
  weeklyCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  weeklyAddBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
  },
  weeklyAddText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1, maxHeight: 100,
    backgroundColor: colors.surfaceLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: colors.text,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
});
