import { Dimensions, StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BASE = '#0D1117';
const SURFACE = '#161B22';
const SURFACE_ELEVATED = '#1C2128';
const BORDER = 'rgba(255,255,255,0.07)';
const PRIMARY = '#7C6AF7';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_SECONDARY = 'rgba(240,246,252,0.6)';
const TEXT_MUTED = 'rgba(240,246,252,0.35)';
const DANGER = '#F87171';

export const profileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BASE },
  heroBg: {
    position: 'absolute',
    top: -80,
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PRIMARY,
    opacity: 0.08,
  },
  scrollContent: { paddingTop: spacing.lg, paddingBottom: 100 },
  hero: { alignItems: 'center', paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },
  avatarGlowWrap: {
    marginBottom: spacing.lg,
    shadowColor: PRIMARY,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  avatarGlowRing: { width: 104, height: 104, borderRadius: 52, padding: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInnerWrap: { width: 98, height: 98, borderRadius: 49, overflow: 'hidden', backgroundColor: SURFACE, borderWidth: 2, borderColor: BASE },
  avatar: { width: '100%', height: '100%' },
  heroName: { fontSize: 34, fontWeight: '900', letterSpacing: -0.8, color: TEXT_PRIMARY, marginBottom: spacing.sm },
  intentBadge: {
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.sm,
  },
  intentBadgeText: { fontSize: typography.bodySmall, fontWeight: '800', color: PRIMARY },
  heroLocation: { fontSize: typography.bodySmall, color: TEXT_MUTED, marginBottom: spacing.xl, fontWeight: '500' },
  ambientStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ambientStat: { alignItems: 'center' },
  ambientStatNum: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 36 },
  ambientStatLabel: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  ambientStatDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: BORDER },
  editBar: { flexDirection: 'row', paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl, gap: spacing.sm, alignItems: 'center' },
  editBtnWrap: { flex: 1, borderRadius: radii.pill, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  editBtn: { paddingVertical: 11, alignItems: 'center', borderRadius: radii.pill },
  editBtnText: { fontSize: typography.bodySmall, fontWeight: '900', letterSpacing: 0.2 },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: 11, borderRadius: radii.pill, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.04)' },
  cancelBtnText: { fontSize: typography.bodySmall, fontWeight: '700', color: TEXT_MUTED },
  section: { paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl },
  sectionEyebrow: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: TEXT_MUTED, marginBottom: spacing.md },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1 },
  tagPillText: { fontSize: 13, fontWeight: '700' },
  fieldsCard: { backgroundColor: SURFACE_ELEVATED, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  fieldLabel: { fontSize: typography.bodySmall, fontWeight: '700', width: 100, color: TEXT_MUTED, textTransform: 'capitalize' },
  fieldValue: { flex: 1, fontSize: typography.bodySmall, fontWeight: '600', textTransform: 'capitalize', color: TEXT_PRIMARY },
  fieldInput: { flex: 1, fontSize: typography.bodySmall, borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 5, borderColor: 'rgba(124,106,247,0.4)', backgroundColor: 'rgba(124,106,247,0.08)', color: TEXT_PRIMARY },
  fieldDivider: { height: 1, backgroundColor: BORDER },
  settingsCard: { backgroundColor: SURFACE_ELEVATED, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: spacing.md },
  settingsIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  settingsLabel: { flex: 1, fontSize: typography.body, fontWeight: '700', color: TEXT_PRIMARY },
  settingsArrow: { fontSize: 22, fontWeight: '300', color: TEXT_MUTED },
  buildInfoCard: { paddingTop: spacing.sm, gap: spacing.xs },
  buildInfoRow: { gap: 4, paddingVertical: spacing.sm },
  buildInfoLabel: { fontSize: typography.bodySmall, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  buildInfoValue: { fontSize: typography.bodySmall, lineHeight: 20, color: TEXT_PRIMARY, fontWeight: '600' },
  buildInfoDivider: { height: 1, backgroundColor: BORDER },
  dangerCard: { backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.28)', borderRadius: 24, padding: spacing.xl, gap: spacing.md },
  dangerTitle: { fontSize: typography.body, fontWeight: '800', color: TEXT_PRIMARY },
  dangerBody: { fontSize: typography.bodySmall, lineHeight: 20, color: TEXT_SECONDARY },
  deleteAccountBtn: { minHeight: 46, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: DANGER },
  deleteAccountBtnPressed: { opacity: 0.88 },
  deleteAccountBtnDisabled: { opacity: 0.6 },
  deleteAccountText: { fontSize: typography.bodySmall, fontWeight: '800', color: '#FFFFFF' },
  errorBanner: { marginHorizontal: spacing.xxl, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)' },
  errorText: { fontSize: typography.bodySmall, fontWeight: '600', color: DANGER },
  logoutBtn: { alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.sm },
  logoutText: { fontSize: typography.body, fontWeight: '800', color: DANGER, letterSpacing: 0.2 },
});

