import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import { useTheme } from '../../../theme/useTheme';
import { radii, shadows, spacing, typography } from '../../../theme/tokens';

export function ProfilePreviewSection({
  children,
  editHint,
  label,
  onPress,
}: PropsWithChildren<{
  editHint?: string;
  label?: string;
  onPress?: () => void;
}>) {
  const theme = useTheme();

  const card = (
    <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
      {label ? (
        <View style={styles.header}>
          <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
          {onPress ? (
            <View style={styles.editRow}>
              {editHint ? (
                <Text style={[styles.editHint, { color: theme.textMuted }]}>{editHint}</Text>
              ) : null}
              <AppIcon name="chevron-right" size={14} color={theme.textMuted} />
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={label ? styles.content : undefined}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={editHint ? `Edit ${label?.toLowerCase()}` : `Edit`}
        style={({ pressed }) => [pressed ? styles.pressed : null]}
      >
        {card}
      </Pressable>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editHint: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  content: {
    marginTop: spacing.md,
  },
});
