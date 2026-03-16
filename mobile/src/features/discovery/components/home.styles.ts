import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../../theme/tokens';

const BASE = '#F8F7F4';
const SURFACE_ELEVATED = '#F5F3EF';
const BORDER = 'rgba(0,0,0,0.06)';
const ACCENT = '#10B981';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_MUTED = '#94A3B8';

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
    fontWeight: '900',
    letterSpacing: 2,
    color: ACCENT,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
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
    fontWeight: '600',
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  intentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
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
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  refineTriggerText: {
    fontSize: 11,
    fontWeight: '700',
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
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(124,106,247,0.08)',
    borderColor: 'rgba(124,106,247,0.20)',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderColor: BORDER,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: TEXT_MUTED,
  },
  filterPillTextActive: {
    color: '#7C6AF7',
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
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.h2,
    fontWeight: '900',
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
    fontWeight: '800',
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
