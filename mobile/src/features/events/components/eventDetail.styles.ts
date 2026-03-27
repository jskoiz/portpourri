import { Dimensions, StyleSheet } from 'react-native';
import { screenLayout } from '../../../design/primitives';
import { radii, spacing, typography } from '../../../theme/tokens';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const HERO_HEIGHT = 300;

export const eventDetailStyles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: screenLayout.screenBottomPadding },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.64,
  },
  backBtnOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
  },
  heroBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  heroBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentCard: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -42,
    paddingTop: spacing.xxxl,
    paddingHorizontal: screenLayout.gutter,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    minHeight: 300,
  },
  kicker: {
    marginBottom: 0,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  hostStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  hostCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  hostLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hostName: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  hostPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  hostPillText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metaList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  metaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  metaLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 24,
  },
  metaSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  descSection: {
    marginBottom: spacing.lg,
  },
  descLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body,
    lineHeight: 26,
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  attendeesCountLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  attendeeList: {
    gap: spacing.sm,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attendeeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  attendeeAvatarImage: {
    width: '100%',
    height: '100%',
  },
  attendeeAvatarText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  attendeeCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  attendeeName: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  attendeeHint: {
    fontSize: typography.bodySmall,
    marginTop: 2,
  },
  attendeeChevron: {
    fontSize: 26,
    lineHeight: 26,
  },
  ctaArea: {
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: '#1F1915',
  },
});
