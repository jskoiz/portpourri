import { StyleSheet } from 'react-native';
import { lightTheme, radii, spacing, typography } from '../../../theme/tokens';

const BASE = lightTheme.background;
const SURFACE = lightTheme.surface;
const SURFACE_ELEVATED = lightTheme.surfaceElevated;
const BORDER = lightTheme.border;
const PRIMARY = lightTheme.primary;
const ACCENT = lightTheme.accent;
const TEXT_PRIMARY = lightTheme.textPrimary;
const TEXT_SECONDARY = lightTheme.textSecondary;
const TEXT_MUTED = lightTheme.textMuted;
const ERROR = lightTheme.danger;

export const createStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  keyboardAvoider: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 80,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.05,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 64,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.8,
    color: PRIMARY,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: TEXT_PRIMARY,
    lineHeight: 36,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: TEXT_MUTED,
    lineHeight: 20,
    maxWidth: 300,
  },
  planCard: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.75)',
    padding: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  planTitle: {
    color: TEXT_PRIMARY,
    fontSize: typography.body,
    fontWeight: '800',
  },
  planStepCount: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  planRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  planPillActive: {
    borderColor: 'rgba(124,106,247,0.32)',
    backgroundColor: 'rgba(124,106,247,0.14)',
  },
  planPillLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  planPillLabelActive: {
    color: TEXT_PRIMARY,
  },
  selectionCard: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.75)',
    gap: spacing.sm,
  },
  selectionEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TEXT_MUTED,
  },
  selectionValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  activitySection: {
    marginBottom: spacing.md,
  },
  selectedPreview: {
    marginHorizontal: spacing.xxl,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: BORDER,
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
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xxl,
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
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
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
  pillWrap: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  pillActive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  pillTextActive: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  pillTextInactive: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    color: TEXT_PRIMARY,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: SURFACE_ELEVATED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 26,
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
  feedbackWrap: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  inlineError: {
    color: ERROR,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  feedbackError: {
    color: ERROR,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  successCard: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.20)',
    backgroundColor: SURFACE_ELEVATED,
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
  postBtnWrap: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
});
