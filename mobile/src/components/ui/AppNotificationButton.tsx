import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import AppIcon from './AppIcon';

interface AppNotificationButtonProps {
  unreadCount?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AppNotificationButton({
  unreadCount = 0,
  onPress,
  style,
}: AppNotificationButtonProps) {
  const theme = useTheme();
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={unreadCount > 0 ? `${badgeLabel} unread notifications` : 'Notifications'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderSoft,
          opacity: pressed ? 0.82 : 1,
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      <AppIcon name="bell" size={16} color={theme.textPrimary} />
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.badgeLabel, { color: theme.textInverse }]}>{badgeLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    letterSpacing: 0.2,
  },
});
