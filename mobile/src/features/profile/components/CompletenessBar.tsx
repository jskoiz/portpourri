import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProfileCompletenessMissingItem } from '../../../api/types';
import { Card } from '../../../design/primitives';
import { radii, spacing, typography } from '../../../theme/tokens';

const PRIMARY = '#C4A882';
const TEXT_PRIMARY = '#2C2420';
const TEXT_SECONDARY = '#5C544C';
const TEXT_MUTED = '#8C8279';
const SUCCESS = '#8BAA7A';

interface CompletenessBarProps {
  earned: number;
  score: number;
  missing: ProfileCompletenessMissingItem[];
  total: number;
  onPressMissing: (item: ProfileCompletenessMissingItem) => void;
}

export function CompletenessBar({
  earned,
  score,
  missing,
  total,
  onPressMissing,
}: CompletenessBarProps) {
  if (missing.length === 0) return null;

  const clampedScore = Math.min(score, 100);
  const barColor = clampedScore >= 60 ? SUCCESS : PRIMARY;
  const remainingCount = missing.length;
  const stepLabel = remainingCount === 1 ? '1 step left to finish' : `${remainingCount} steps left to finish`;
  const progressLabel = total > 0 ? `${earned} of ${total} profile details complete` : `${clampedScore}% complete`;

  return (
    <View
      style={styles.wrapper}
      testID="completeness-bar"
      accessibilityRole="progressbar"
      accessibilityLabel="Profile completeness"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedScore,
        text: `${clampedScore}% complete`,
      }}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Complete your profile</Text>
            <Text style={styles.subtitle}>{stepLabel}</Text>
          </View>
          <Text style={styles.percentage}>{clampedScore}%</Text>
        </View>

        <View style={styles.trackOuter}>
          <View
            style={[styles.trackFill, { width: `${clampedScore}%`, backgroundColor: barColor }]}
          />
        </View>

        <Text style={styles.progressLabel}>{progressLabel}</Text>

        <View style={styles.checklist}>
          {missing.map((item) => (
            <Pressable
              key={item.field}
              style={styles.checklistRow}
              onPress={() => onPressMissing(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint="Opens profile editing so you can complete this step"
            >
              <View style={styles.checklistBadge}>
                <View style={styles.checklistBadgeDot} />
              </View>
              <Text style={styles.checklistText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}

const SOFT_SHADOW = {
  shadowColor: '#B0A89E',
  shadowOpacity: 0.16,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    ...SOFT_SHADOW,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: typography.caption,
    color: TEXT_SECONDARY,
  },
  percentage: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
    color: PRIMARY,
  },
  trackOuter: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  progressLabel: {
    fontSize: typography.caption,
    color: TEXT_MUTED,
  },
  checklist: {
    gap: spacing.sm,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(196,168,130,0.10)',
  },
  checklistBadge: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(196,168,130,0.16)',
  },
  checklistBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: PRIMARY,
  },
  checklistText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
});
