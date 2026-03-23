import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SkeletonBox, SkeletonTextLine } from '../../design/primitives';
import { radii, spacing } from '../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 420;

/** Skeleton placeholder for the ProfileDetail screen. */
export function ProfileDetailSkeleton({ testID }: { testID?: string }) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Hero photo */}
      <SkeletonBox
        width={SCREEN_WIDTH}
        height={HERO_HEIGHT}
        borderRadius={0}
        testID="skeleton-profile-hero"
      />
      {/* Name + location */}
      <View style={styles.content}>
        <SkeletonTextLine width="45%" style={styles.line} />
        <SkeletonTextLine width="30%" style={styles.line} />
        {/* Bio section */}
        <View style={styles.section}>
          <SkeletonBox width={80} height={10} borderRadius={4} style={styles.line} />
          <SkeletonTextLine width="100%" style={styles.line} />
          <SkeletonTextLine width="85%" style={styles.line} />
        </View>
        {/* Fitness rows */}
        <View style={styles.section}>
          <SkeletonBox width="100%" height={44} borderRadius={radii.lg} style={styles.line} />
          <SkeletonBox width="100%" height={44} borderRadius={radii.lg} style={styles.line} />
          <SkeletonBox width="100%" height={44} borderRadius={radii.lg} style={styles.line} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  section: {
    marginTop: spacing.xl,
  },
  line: {
    marginBottom: spacing.md,
  },
});
