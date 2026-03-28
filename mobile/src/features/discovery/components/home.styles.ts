import { StyleSheet } from 'react-native';
import { screenLayout } from '../../../design/primitives';
import { lightTheme, radii, spacing, typography } from '../../../theme/tokens';

const BASE = lightTheme.background;
const SURFACE_ELEVATED = lightTheme.surfaceElevated;
const SUBDUED_SURFACE = lightTheme.subduedSurface;
const CHIP_SURFACE = lightTheme.chipSurface;
const STROKE = lightTheme.stroke;
const SELECTED_FILL = lightTheme.selectedFill;
const TEXT_PRIMARY = lightTheme.textPrimary;
const TEXT_MUTED = lightTheme.textMuted;

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  topBar: {
    paddingHorizontal: screenLayout.gutter,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.sm,
  },
  heroSummaryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  notificationButton: {
    width: 40,
    height: 40,
  },
  intentBadgeWrap: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  intentBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  intentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  filterPillsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBar: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: spacing.xs,
  },
  refineTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: CHIP_SURFACE,
  },
  refineTriggerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    alignItems: 'center',
    paddingRight: spacing.xl,
  },
  filterPill: {
    paddingHorizontal: spacing.sm + 6,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minHeight: 34,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: SELECTED_FILL,
  },
  filterPillInactive: {
    backgroundColor: CHIP_SURFACE,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: TEXT_MUTED,
  },
  filterPillTextActive: {
    color: lightTheme.selectedText,
  },
  deckArea: {
    flex: 1,
    paddingHorizontal: screenLayout.gutter,
    paddingTop: 2,
    paddingBottom: 2,
  },
  deckAreaInner: {
    flex: 1,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    paddingTop: spacing.lg,
    backgroundColor: BASE,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: STROKE,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.h2,
    fontWeight: '700',
    letterSpacing: -0.8,
    paddingHorizontal: screenLayout.gutter,
    marginBottom: spacing.lg,
    color: TEXT_PRIMARY,
  },
  modalContent: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: 80,
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_MUTED,
    marginBottom: spacing.sm,
  },
  filterInputRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
});
