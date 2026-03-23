import { Dimensions, StyleSheet } from 'react-native';
import { lightTheme, radii, spacing, typography } from '../../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 420;

const BASE = lightTheme.background;
const SURFACE = lightTheme.surface;
const PRIMARY = lightTheme.primary;
const BORDER = lightTheme.border;
const TEXT_PRIMARY = lightTheme.textPrimary;
const TEXT_MUTED = lightTheme.textMuted;

export const profileDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    fontSize: 96,
    fontWeight: '900',
    letterSpacing: -4,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.75,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  overflowButtonOverlay: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  overflowButton: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.pill,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowBackdrop: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 88,
    paddingRight: spacing.lg,
  },
  overflowMenu: {
    backgroundColor: SURFACE,
    borderRadius: radii.lg,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  overflowMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  overflowMenuText: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  heroNameOverlay: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xxl,
    right: spacing.xxl,
  },
  intentPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(196,168,130,0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.34)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  intentPillText: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroName: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  heroLocation: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(196,168,130,0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.25)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentArea: {
    backgroundColor: 'rgba(253,251,248,0.92)',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: typography.body,
    lineHeight: 28,
    opacity: 0.88,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPanel: {
    gap: spacing.sm,
  },
  metaIntroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(247,244,240,0.82)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  metaIntroText: {
    lineHeight: 22,
    fontSize: typography.bodySmall,
  },
  activityPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  activityPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  structuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(247,244,240,0.76)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  structuredLabel: {
    color: TEXT_MUTED,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  structuredValue: {
    color: TEXT_PRIMARY,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  suggestBtn: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 120,
    marginTop: spacing.sm,
  },
  suggestBtnInner: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  suggestBtnText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingBottom: spacing.xxl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
  heroTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroTag: {
    backgroundColor: 'rgba(196,168,130,0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.25)',
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroIntentPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(196,168,130,0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.34)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  heroIntentText: {
    color: PRIMARY,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSection: {
    marginBottom: spacing.xxl,
  },
  infoSection: {
    marginBottom: spacing.xxl,
  },
  heroOverlayCard: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    backgroundColor: 'rgba(253,251,248,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroLocationLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: spacing.xs,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  heroStatValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
  },
});
