import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../theme/tokens';

export const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  trigger: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triggerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  triggerValue: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  triggerPlaceholder: {
    fontSize: typography.body,
    fontWeight: '500',
  },
  helperText: {
    marginTop: spacing.xs,
    marginLeft: 2,
    fontSize: typography.caption,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: 2,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  optionMeta: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  searchEmpty: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  searchEmptyTitle: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  searchEmptyBody: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  inputGroup: {
    gap: spacing.sm,
  },
});
