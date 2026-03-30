import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'RoutineForm'>;

const DAYS = [
  { key: 'MONDAY', label: 'MON' },
  { key: 'TUESDAY', label: 'TUE' },
  { key: 'WEDNESDAY', label: 'WED' },
  { key: 'THURSDAY', label: 'THU' },
  { key: 'FRIDAY', label: 'FRI' },
  { key: 'SATURDAY', label: 'SAT' },
  { key: 'SUNDAY', label: 'SUN' },
];

export default function RoutineFormScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Routine name is required');
      return;
    }
    setNameError('');
    setLoading(true);

    try {
      await api.post('/routines', {
        name: trimmedName,
        description: description.trim() || undefined,
        days: selectedDays,
        isPublic,
      });
      navigation.goBack();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to create routine';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New Routine</Text>

        <View style={styles.section}>
          <Input
            label="Routine Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Push Day, Full Body..."
            error={nameError}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your routine..."
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Training Days</Text>
          <View style={styles.daysContainer}>
            {DAYS.map(({ key, label }) => {
              const isSelected = selectedDays.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => toggleDay(key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.sectionLabel}>Public Routine</Text>
              <Text style={styles.switchHint}>
                Others can view and copy this routine
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Create Routine"
            onPress={handleCreate}
            loading={loading}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
});
