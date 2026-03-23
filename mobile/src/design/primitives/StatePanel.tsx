import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import AppIcon from '../../components/ui/AppIcon';
import { useTheme } from '../../theme/useTheme';
import { Button } from './Button';
import { Card } from './Card';
import { primitiveStyles } from './primitiveStyles';

export function StatePanel({
  actionLabel,
  description,
  isError,
  loading,
  onAction,
  title,
}: {
  actionLabel?: string;
  description?: string;
  isError?: boolean;
  loading?: boolean;
  onAction?: () => void;
  title: string;
}) {
  const theme = useTheme();
  const icon = isError ? 'alert-circle' : 'compass';

  return (
    <View
      style={primitiveStyles.stateContainer}
      accessibilityRole={isError ? 'alert' : undefined}
    >
      <Card style={primitiveStyles.statePanel}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={primitiveStyles.loader}
            accessibilityLabel={`Loading: ${title}`}
          />
        ) : (
          <View
            style={[
              primitiveStyles.iconCircle,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <AppIcon name={icon} size={24} color={isError ? theme.danger : theme.primary} />
          </View>
        )}
        <Text style={[primitiveStyles.stateTitle, { color: theme.textPrimary }]}>{title}</Text>
        {description ? <Text style={[primitiveStyles.stateDescription, { color: theme.textSecondary }]}>{description}</Text> : null}
        {actionLabel && onAction ? (
          <Button label={actionLabel} onPress={onAction} style={primitiveStyles.stateButton} variant={isError ? 'danger' : 'primary'} />
        ) : null}
      </Card>
    </View>
  );
}
