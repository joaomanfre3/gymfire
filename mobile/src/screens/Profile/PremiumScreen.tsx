import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { typography } from '../../theme/typography';
import api from '../../api/client';

interface PremiumStatus {
  isPremium: boolean;
  plan: string;
  features: Record<string, any>;
}

const COMPARISON_ROWS = [
  { feature: 'Routines', free: '3', premium: 'Unlimited', icon: 'clipboard-outline' },
  { feature: 'Folders', free: '2', premium: 'Unlimited', icon: 'folder-outline' },
  { feature: 'Streak Freeze', free: 'No', premium: '1/week', icon: 'snow-outline' },
  { feature: 'Points Bonus', free: 'Normal', premium: '+20%', icon: 'star-outline' },
  { feature: 'Ads', free: 'Yes', premium: 'No', icon: 'megaphone-outline' },
  { feature: 'Export', free: 'No', premium: 'PDF/CSV', icon: 'download-outline' },
];

export default function PremiumScreen() {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/premium/status');
      setStatus(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'Payment integration will be available in a future update. Stay tuned!',
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isPremium = status?.isPremium ?? false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.fireEmoji}>{'\uD83D\uDD25'}</Text>
        <Text style={styles.title}>GymFire Premium</Text>
        {isPremium && (
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
        <Text style={styles.subtitle}>
          {isPremium
            ? 'You are enjoying all premium features'
            : 'Unlock the full power of your training'}
        </Text>
      </View>

      {/* Comparison Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Feature</Text>
          <Text style={[styles.tableHeaderText, styles.tableCol]}>Free</Text>
          <Text style={[styles.tableHeaderText, styles.tableCol, styles.premiumCol]}>
            Premium
          </Text>
        </View>

        {/* Table Rows */}
        {COMPARISON_ROWS.map((row, index) => (
          <View
            key={row.feature}
            style={[
              styles.tableRow,
              index === COMPARISON_ROWS.length - 1 && styles.tableRowLast,
            ]}
          >
            <View style={styles.featureCell}>
              <Ionicons
                name={row.icon as any}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.featureText}>{row.feature}</Text>
            </View>
            <Text style={[styles.cellText, styles.tableCol, styles.freeValue]}>
              {row.free}
            </Text>
            <Text
              style={[
                styles.cellText,
                styles.tableCol,
                styles.premiumCol,
                styles.premiumValue,
              ]}
            >
              {row.premium}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeBtn}
          activeOpacity={0.7}
          onPress={handleUpgrade}
        >
          <Ionicons name="flash" size={22} color="#FFF" />
          <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
        </TouchableOpacity>
      )}

      {isPremium && (
        <View style={styles.premiumInfo}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <Text style={styles.premiumInfoText}>
            Thank you for supporting GymFire! You have access to all premium
            features.
          </Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        {isPremium
          ? 'Manage your subscription in your device settings.'
          : 'Cancel anytime. No commitment.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  fireEmoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginTop: spacing.sm,
  },
  activeBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as '600',
    color: colors.success,
  },

  // Comparison Table
  table: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  tableHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCol: {
    width: 80,
    textAlign: 'center',
  },
  premiumCol: {
    color: colors.primary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  featureCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  freeValue: {
    color: colors.textMuted,
  },
  premiumValue: {
    color: colors.primary,
    fontWeight: fontWeight.semibold as '600',
  },

  // CTA
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },

  // Premium active info
  premiumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    marginBottom: spacing.lg,
  },
  premiumInfoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
