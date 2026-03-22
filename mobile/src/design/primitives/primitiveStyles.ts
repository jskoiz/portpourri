import { StyleSheet } from 'react-native';
import { radii, shadows, spacing, typography } from '../../theme/tokens';

export const primitiveStyles = StyleSheet.create({
  buttonBase: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardGlass: {
    padding: spacing.lg,
    flexDirection: 'row',
  },
  accentStrip: {
    width: 3,
    borderRadius: 2,
    marginRight: spacing.md,
    alignSelf: 'stretch',
  },
  accentContent: {
    flex: 1,
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  imageOverlay: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  inputWrapperOuter: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputGlow: {
    borderRadius: radii.md,
    borderWidth: 2,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: typography.body,
    minHeight: 48,
  },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: 2,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  statePanel: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...shadows.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  loader: {
    marginBottom: spacing.lg,
  },
  stateTitle: {
    fontSize: typography.h3,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  stateDescription: {
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  stateButton: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
