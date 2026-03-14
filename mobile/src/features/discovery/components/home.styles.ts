import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../../theme/tokens';

const BASE = '#0D1117';
const SURFACE_ELEVATED = '#1C2128';
const BORDER = 'rgba(255,255,255,0.08)';
const ACCENT = '#34D399';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_MUTED = 'rgba(240,246,252,0.45)';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  topBar: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heroPanel: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  heroPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  greetingEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
    color: ACCENT,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.9,
    lineHeight: 30,
    marginBottom: spacing.xs,
  },
  greetingSub: {
    fontSize: typography.bodySmall,
    color: TEXT_MUTED,
    lineHeight: 20,
    maxWidth: 240,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: spacing.md,
  },
  heroMetric: {
    flex: 1,
    gap: 2,
  },
  heroMetricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: BORDER,
    marginHorizontal: spacing.lg,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: TEXT_MUTED,
  },
  heroMetricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  intentBadgeText: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  filterPillsScroll: {
    maxHeight: 42,
    flexGrow: 0,
  },
  filterBar: {
    paddingBottom: spacing.xs,
  },
  filterBarHeader: {
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  filterBarLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  refineTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refineTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: 'rgba(124,106,247,0.18)',
    borderColor: 'rgba(124,106,247,0.34)',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: BORDER,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xs,
  },
  deckHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  deckArea: {
    flex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    flexDirection: 'row',
    gap: spacing.sm,
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

