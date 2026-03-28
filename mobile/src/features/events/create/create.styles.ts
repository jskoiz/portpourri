import { StyleSheet } from 'react-native';
import { screenLayout } from '../../../design/primitives';
import { lightTheme, radii, spacing, typography } from '../../../theme/tokens';

const BASE = lightTheme.background;
const SURFACE = lightTheme.surface;
const SURFACE_ELEVATED = lightTheme.surfaceElevated;
const ACCENT = lightTheme.accentPrimary;
const CHIP_SURFACE = lightTheme.chipSurface;
const TEXT_PRIMARY = lightTheme.textPrimary;
const TEXT_SECONDARY = lightTheme.textSecondary;
const TEXT_MUTED = lightTheme.textMuted;
const ERROR = lightTheme.danger;

/**
 * Shared / layout styles consumed across the create-event flow
 * (activity picker, success card, etc.).
 */
export const createStyles = StyleSheet.create({
  /* ── Layout / scaffold ──────────────────────────────────── */
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  keyboardAvoider: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 64,
    right: -140,
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: screenLayout.screenBottomPadding,
  },

  /* ── Plan summary card (CreatePlanSummaryCard) ──────────── */
  planCard: {
    borderRadius: 24,
    backgroundColor: SURFACE,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  planHeaderCopy: {
    flex: 1,
  },
  planTitle: {
    color: TEXT_PRIMARY,
    fontSize: typography.body,
    fontWeight: '800',
  },
  planMeta: {
    marginTop: 4,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '500',
  },
  planStepCount: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  planStack: {
    gap: spacing.sm,
  },
  planStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  planStepActive: {
    shadowColor: '#B0A89E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  planStepMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CHIP_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planStepNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  planStepCopy: {
    flex: 1,
  },
  planStepLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  planStepValue: {
    marginTop: 2,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '600',
  },
  selectionHint: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },

  /* ── Activity picker (CreateActivityPicker) ─────────────── */
  activitySection: {
    marginBottom: spacing.md,
  },
  selectedPreview: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  selectedPreviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  selectedPreviewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPreviewText: {
    flex: 1,
  },
  selectedPreviewEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  selectedPreviewLabel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: TEXT_PRIMARY,
  },
  activityPrompt: {
    marginBottom: spacing.md,
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityTileWrap: {
    alignItems: 'center',
    gap: 4,
  },
  activityTile: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  /* ── Shared form primitives ─────────────────────────────── */
  formSection: { marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: TEXT_MUTED,
    marginBottom: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  stepperValueWrap: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 40,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
    lineHeight: 44,
  },
  stepperSub: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inlineError: {
    color: ERROR,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  selectionError: {
    color: ERROR,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: screenLayout.gutter,
  },

  /* ── Feedback / submit area (CreateScreenContent) ───────── */
  feedbackWrap: {
    paddingHorizontal: screenLayout.gutter,
    marginBottom: spacing.md,
  },
  feedbackError: {
    color: ERROR,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },

  /* ── Success card (CreateSuccessCard) ───────────────────── */
  successCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: SURFACE_ELEVATED,
  },
  successCardInner: {
    gap: spacing.md,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  successIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCopy: {
    flex: 1,
    gap: 2,
  },
  successEyebrow: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  successTitle: {
    color: TEXT_PRIMARY,
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  successMeta: {
    color: TEXT_SECONDARY,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  successActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  successActionButton: {
    flex: 1,
  },
  successSecondaryAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  successSecondaryActionText: {
    color: TEXT_MUTED,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },

  /* ── Post button ────────────────────────────────────────── */
  postBtnWrap: {
    marginHorizontal: screenLayout.gutter,
    marginTop: spacing.md,
    backgroundColor: '#1F1915',
  },
});
