import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../../theme/tokens';

const BASE = '#FDFBF8';
const SURFACE_ELEVATED = '#F7F4F0';
const BORDER = '#E8E2DA';
const TEXT_PRIMARY = '#2C2420';
const TEXT_MUTED = '#8C8279';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  topBar: {
    paddingHorizontal: spacing.xxl,
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
  greetingEyebrow: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.6,
    lineHeight: 24,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.sm,
  },
  heroSummaryText: {
    flex: 1,
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  filterPillsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBar: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xs,
  },
  refineTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: spacing.sm + 1,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(44,36,32,0.05)',
  },
  refineTriggerText: {
    fontSize: 11,
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
    paddingVertical: 5,
    borderRadius: radii.pill,
    minHeight: 32,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#2C2420',
    borderColor: '#2C2420',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(44,36,32,0.06)',
    borderWidth: 0,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: TEXT_MUTED,
  },
  filterPillTextActive: {
    color: '#FDFBF8',
  },
  deckArea: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
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
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.h2,
    fontWeight: '700',
    letterSpacing: -0.8,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
    color: TEXT_PRIMARY,
  },
  modalContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 80,
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_MUTED,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  filterInputRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  miniInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.bodySmall,
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    color: TEXT_PRIMARY,
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
