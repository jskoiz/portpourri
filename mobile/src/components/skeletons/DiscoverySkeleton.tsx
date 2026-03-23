import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SkeletonBox, SkeletonTextLine } from '../../design/primitives';
import { radii, spacing } from '../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.xxl * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

/** Skeleton placeholder for the Discovery / Home swipe-deck screen. */
export function DiscoverySkeleton({ testID }: { testID?: string }) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Photo area */}
      <SkeletonBox
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        borderRadius={radii.xl}
        style={styles.card}
        testID="skeleton-discovery-photo"
      />
      {/* Name line */}
      <SkeletonTextLine width="50%" style={styles.line} />
      {/* Bio lines */}
      <SkeletonTextLine width="90%" style={styles.line} />
      <SkeletonTextLine width="70%" style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  line: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
});
