import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../design/primitives';
import { radii, spacing, typography } from '../../../theme/tokens';

const PRIMARY = '#C4A882';
const TEXT_PRIMARY = '#2C2420';
const TEXT_SECONDARY = '#5C544C';
const SUCCESS = '#8BAA7A';

interface DiscoveryNudgeCardProps {
  score: number;
  onPress: () => void;
}

export function DiscoveryNudgeCard({ score, onPress }: DiscoveryNudgeCardProps) {
  if (score >= 60) return null;

  const barColor = score >= 40 ? SUCCESS : PRIMARY;

  return (
    <Pressable onPress={onPress} testID="discovery-nudge-card" accessibilityRole="button" accessibilityLabel="Complete your profile to get more matches">
      <Card style={styles.card}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>Finish your profile to get more matches</Text>

        <View style={styles.progressRow}>
          <View style={styles.trackOuter}>
            <View
              style={[styles.trackFill, { width: `${Math.min(score, 100)}%`, backgroundColor: barColor }]}
            />
          </View>
          <Text style={styles.percentage}>{score}%</Text>
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Tap to complete</Text>
        </View>
      </Card>
    </Pressable>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.md,
    marginHorizontal: spacing.xxl,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.18)',
    ...SOFT_SHADOW,
  },
  title: {
    fontSize: typography.body,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trackOuter: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  percentage: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
    color: PRIMARY,
    minWidth: 36,
    textAlign: 'right',
  },
  ctaRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(196,168,130,0.12)',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: PRIMARY,
  },
});
