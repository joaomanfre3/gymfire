'use strict';

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import api from '../../api/client';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  _count?: { members: number };
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/groups', {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      fetchGroups();
      Alert.alert('Sucesso', 'Grupo criado!');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo.');
    }
    setCreating(false);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchGroups().finally(() => setRefreshing(false));
  }

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupCard}>
      <View style={styles.groupAvatar}>
        <Text style={styles.groupAvatarText}>{item.name[0].toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <Text style={styles.groupMembers}>{item._count?.members || 0} membros</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Grupos</Text>
          <Text style={styles.headerSub}>Compete com seus amigos</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.addBtnText}>Criar</Text>
        </TouchableOpacity>
      </View>

      {/* Create modal */}
      {showCreate && (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Novo Grupo</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Nome do grupo"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={newDesc}
            onChangeText={setNewDesc}
            placeholder="Descrição (opcional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.surfaceLight, flex: 1 }]}
              onPress={() => setShowCreate(false)}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { flex: 1 }, (!newName.trim() || creating) && { opacity: 0.4 }]}
              onPress={handleCreate}
              disabled={!newName.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={{ color: colors.textInverse, fontWeight: '700' }}>Criar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Groups list */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={colors.surfaceLight} />
          <Text style={styles.emptyText}>Nenhum grupo ainda</Text>
          <Text style={styles.emptyDesc}>Crie um grupo e convide seus amigos!</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
  createCard: {
    margin: 16, padding: 16, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    gap: 12,
  },
  createTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  input: {
    backgroundColor: colors.surfaceLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.text,
  },
  createBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 12,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  groupAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  groupAvatarText: { fontSize: 18, fontWeight: '700', color: colors.textInverse },
  groupName: { fontSize: 14, fontWeight: '600', color: colors.text },
  groupDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  groupMembers: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
