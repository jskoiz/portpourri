import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface AppStateProps {
  title: string;
  description?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AppState({ title, description, loading, actionLabel, onAction }: AppStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : <Text style={styles.emoji}>✨</Text>}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} style={styles.button} /> : null}
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
    maxWidth: 380,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    alignItems: 'center',
  },
  loader: {
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 24,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
