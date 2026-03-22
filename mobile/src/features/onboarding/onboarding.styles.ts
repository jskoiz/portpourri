import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme/tokens';
import { fontFamily } from '../../lib/fonts';

export const summaryStyles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    opacity: 0.6,
  },
});

export const styles = StyleSheet.create({
  container: { flex: 1 },

  progressTrack: {
    height: 4,
    width: '100%',
    opacity: 0.7,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  backButtonRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  shellHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  chapterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  // Full-screen steps (Welcome + Holy Sh*t)
  fullScreenStep: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl + 4,
  },

  // Scroll steps
  stepContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },

  stepHeadline: {
    fontSize: 34,
    fontFamily: fontFamily.serifBold,
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.body,
    lineHeight: 25,
    marginBottom: spacing.xxxl,
    maxWidth: 320,
  },

  stepFooter: {
    paddingTop: spacing.md,
  },

  // ── Welcome step ─────────────────────────────────────────────────────────
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  welcomeIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  welcomeHeadline: {
    fontSize: 42,
    fontFamily: fontFamily.serifBold,
    letterSpacing: -1.0,
    lineHeight: 48,
  },
  welcomeBody: {
    fontSize: typography.body,
    lineHeight: 28,
    fontWeight: '400',
    maxWidth: 320,
  },

  // ── Intent cards ──────────────────────────────────────────────────────────
  intentCards: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  intentCard: {
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  intentCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  intentCardTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
  },
  intentCardSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },

  // ── Activity grid ─────────────────────────────────────────────────────────
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  activityTile: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    minWidth: 90,
  },
  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Large cards (frequency / social) ─────────────────────────────────────
  largeCards: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  largeCard: {
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: 4,
  },
  largeCardLabel: {
    fontSize: typography.h3,
    fontWeight: '800',
  },
  largeCardSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },

  // ── Schedule cards ────────────────────────────────────────────────────────
  scheduleCard: {
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Social cards ──────────────────────────────────────────────────────────
  socialCards: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  socialCard: {
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  socialCardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialCardText: {
    flex: 1,
  },
  socialCardTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    marginBottom: 2,
  },
  socialCardSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Summary card ──────────────────────────────────────────────────────────
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },

  // ── Holy sh*t step ────────────────────────────────────────────────────────
  holyShitContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  countBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#C4A882',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  countLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  holyShitHeadline: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 42,
    textAlign: 'center',
  },
  holyShitBody: {
    fontSize: typography.body,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    maxWidth: 280,
  },
  avatarBlur: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
