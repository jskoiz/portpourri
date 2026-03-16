import { Dimensions, StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = spacing.xxl;
const BASE = '#F8F7F4';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.06)';
const PRIMARY = '#7C6AF7';
const ACCENT = '#10B981';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_SECONDARY = '#64748B';
const TEXT_MUTED = '#94A3B8';
const SPOT_CARD_WIDTH = 140;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const exploreStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BASE },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: PRIMARY,
    opacity: 0.03,
  },
  scrollContent: { paddingBottom: 80 },
  hero: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroCopy: { flex: 1 },
  heroNotificationButton: { marginTop: spacing.xs },
  heroActionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs, ...CARD_SHADOW },
  heroEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 3.5, color: ACCENT, marginBottom: spacing.sm },
  heroTitle: { fontSize: 38, fontWeight: '800', letterSpacing: -1.2, color: TEXT_PRIMARY, lineHeight: 40, marginBottom: spacing.sm },
  heroSubtitle: { fontSize: typography.body, fontWeight: '500', color: TEXT_MUTED, lineHeight: 22, maxWidth: 290 },
  categoriesScroll: { marginBottom: spacing.md },
  categoriesRow: { paddingHorizontal: CARD_PADDING, gap: spacing.sm, paddingRight: CARD_PADDING },
  categoryPill: { paddingHorizontal: 15, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1 },
  categoryPillActive: { backgroundColor: PRIMARY + '14', borderColor: PRIMARY + '30' },
  categoryPillInactive: { backgroundColor: 'rgba(0,0,0,0.04)', borderColor: BORDER },
  categoryPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  sheetSectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: spacing.md },
  sheetChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sheetActionStack: { gap: spacing.sm, marginTop: spacing.md },
  section: { paddingHorizontal: CARD_PADDING, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, color: TEXT_PRIMARY },
  seeAll: { fontSize: typography.caption, fontWeight: '700', color: PRIMARY },
  eventCard: { borderRadius: 18, borderWidth: 0, marginBottom: spacing.md, overflow: 'hidden', backgroundColor: SURFACE, ...CARD_SHADOW },
  eventBanner: { height: 88, justifyContent: 'flex-end', padding: spacing.md },
  eventBannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bannerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  eventIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  categoryBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: '#FFFFFF' },
  stateBadge: { backgroundColor: 'rgba(11,18,25,0.28)' },
  eventBody: { padding: spacing.md + 2 },
  eventTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4, color: TEXT_PRIMARY, marginBottom: spacing.xs },
  eventMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  eventMetaInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMeta: { fontSize: typography.caption, color: TEXT_SECONDARY, fontWeight: '600' },
  attendeesBadge: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: BORDER },
  attendeesBadgeText: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED },
  attendeesBadgeInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventActions: { flexDirection: 'row', gap: spacing.sm },
  joinBtn: { flex: 1, minHeight: 42, paddingHorizontal: spacing.lg },
  inviteBtn: { minHeight: 42, paddingHorizontal: spacing.lg },
  spotsRow: { gap: spacing.md, paddingRight: CARD_PADDING },
  spotsEmptyState: { marginTop: spacing.md, borderRadius: 16, borderWidth: 0, backgroundColor: SURFACE, padding: spacing.md, ...CARD_SHADOW },
  spotsEmptyTitle: { fontSize: typography.bodySmall, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 4 },
  spotsEmptyCopy: { fontSize: typography.caption, color: TEXT_MUTED, lineHeight: 18 },
  spotCard: { width: SPOT_CARD_WIDTH, borderRadius: 18, borderWidth: 0, padding: spacing.md, backgroundColor: SURFACE, ...CARD_SHADOW },
  spotIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  spotName: { fontSize: typography.bodySmall, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 2 },
  spotType: { fontSize: 11, color: TEXT_MUTED, marginBottom: spacing.xs, fontWeight: '500' },
  spotDistance: { fontSize: 11, fontWeight: '800' },
  communityCard: { borderRadius: 16, borderWidth: 0, marginBottom: spacing.md, overflow: 'hidden', backgroundColor: SURFACE, flexDirection: 'row', ...CARD_SHADOW },
  communityAccentStrip: { width: 3 },
  communityInner: { flex: 1, padding: spacing.md },
  communityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: typography.body, fontWeight: '900' },
  communityMeta: { flex: 1 },
  communityUser: { fontSize: typography.bodySmall, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 3 },
  activityPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill, borderWidth: 1 },
  activityPillText: { fontSize: 10, fontWeight: '800' },
  spotsBadge: { backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  spotsBadgeText: { fontSize: 10, fontWeight: '800', color: ACCENT },
  communityText: { fontSize: typography.bodySmall, lineHeight: 20, color: TEXT_SECONDARY, marginBottom: spacing.md },
  communityActions: { flexDirection: 'row', gap: spacing.sm },
  inviteSmallBtn: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(0,0,0,0.04)' },
  inviteSmallText: { fontSize: typography.bodySmall, fontWeight: '600', color: TEXT_PRIMARY },
  screenWidth: { width: SCREEN_WIDTH },
});
