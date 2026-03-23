import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonCircle, SkeletonTextLine } from '../../design/primitives';
import { spacing } from '../../theme/tokens';

function ChatRowSkeleton({ testID }: { testID?: string }) {
  return (
    <View style={styles.row} testID={testID}>
      <SkeletonCircle size={52} />
      <View style={styles.lines}>
        <SkeletonTextLine width="55%" />
        <SkeletonTextLine width="80%" style={styles.subLine} />
      </View>
    </View>
  );
}

/** Skeleton placeholder for the chat/matches list screen. */
export function ChatListSkeleton({ count = 5, testID }: { count?: number; testID?: string }) {
  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: count }, (_, i) => (
        <ChatRowSkeleton key={i} testID={i === 0 ? 'skeleton-chat-row' : undefined} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  lines: {
    flex: 1,
    marginLeft: spacing.lg,
    gap: spacing.sm,
  },
  subLine: {
    marginTop: spacing.xs,
  },
});
