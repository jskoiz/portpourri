import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import AppIcon from './AppIcon';
import { useTheme } from '../../theme/useTheme';
import { spacing, typography } from '../../theme/tokens';

interface AppStateProps {
  title: string;
  description?: string;
  loading?: boolean;
  isError?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

const ICONS: Record<string, React.ComponentProps<typeof AppIcon>['name']> = {
  loading: 'loader',
  error: 'alert-circle',
  empty: 'compass',
};

export default function AppState({ title, description, loading, isError, actionLabel, onAction }: AppStateProps) {
  const theme = useTheme();
  const icon = isError ? ICONS.error : ICONS.empty;

  return (
    <View style={styles.container}>
      <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <AppIcon name={icon} size={24} color={isError ? theme.danger : theme.primary} />
          </View>
        )}
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
        ) : null}
        {actionLabel && onAction ? (
          <AppButton
            label={actionLabel}
            onPress={onAction}
            style={styles.button}
            variant={isError ? 'danger' : 'primary'}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: spacing.xxl + 8,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
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
  title: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  description: {
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
