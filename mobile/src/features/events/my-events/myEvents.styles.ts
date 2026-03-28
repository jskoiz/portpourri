import { StyleSheet } from 'react-native';
import { screenLayout } from '../../../design/primitives';
import { radii, spacing, typography } from '../../../theme/tokens';

export const myEventsStyles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  tabBar: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabActive: {},
  tabText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '800',
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl,
  },
  emptyStateSection: { marginTop: spacing.xl },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyCta: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  emptyCtaText: {
    fontSize: typography.body,
    fontWeight: '800',
  },

  list: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: screenLayout.screenBottomPadding,
  },
  card: {
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardCategoryBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: typography.bodySmall,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
});
