import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SkeletonTextLine } from '../../design/primitives';
import { radii, spacing } from '../../theme/tokens';

function EventCardSkeleton({ testID }: { testID?: string }) {
  return (
    <View style={styles.card} testID={testID}>
      <SkeletonBox width="100%" height={140} borderRadius={radii.lg} />
      <View style={styles.cardContent}>
        <SkeletonTextLine width="65%" />
        <SkeletonTextLine width="45%" style={styles.subLine} />
        <SkeletonTextLine width="30%" style={styles.subLine} />
      </View>
    </View>
  );
}

/** Skeleton placeholder for the Events / Explore screen event list. */
export function EventsSkeleton({ count = 3, testID }: { count?: number; testID?: string }) {
  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} testID={i === 0 ? 'skeleton-event-card' : undefined} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  cardContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  subLine: {
    marginTop: spacing.xs,
  },
});
