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
  score: number;
  missing: ProfileCompletenessMissingItem[];
  onPressMissing: (item: ProfileCompletenessMissingItem) => void;
}

export function CompletenessBar({ score, missing, onPressMissing }: CompletenessBarProps) {
  if (score >= 80) return null;

  const barColor = score >= 60 ? SUCCESS : PRIMARY;

  return (
    <View
      style={styles.wrapper}
      testID="completeness-bar"
      accessibilityRole="progressbar"
      accessibilityLabel="Profile completeness"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.min(score, 100),
        text: `${Math.min(score, 100)}% complete`,
      }}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.percentage}>{score}%</Text>
        </View>

        <View style={styles.trackOuter}>
          <View
            style={[styles.trackFill, { width: `${Math.min(score, 100)}%`, backgroundColor: barColor }]}
          />
        </View>

        {missing.length > 0 ? (
          <View style={styles.chips}>
            {missing.map((item) => (
              <Pressable
                key={item.field}
                style={styles.chip}
                onPress={() => onPressMissing(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text style={styles.chipText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
    alignItems: 'center',
  },
  title: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: TEXT_PRIMARY,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(196,168,130,0.10)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
});
