import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { lightTheme, radii } from '../../theme/tokens';
import AppIcon from './AppIcon';

interface AppNotificationButtonProps {
  unreadCount?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function AppNotificationButton({
  unreadCount = 0,
  onPress,
  style,
  testID,
}: AppNotificationButtonProps) {
  const theme = useTheme();
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={unreadCount > 0 ? `${badgeLabel} unread notifications` : 'Notifications'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.82 : 1 },
        style,
      ]}
    >
      <AppIcon name="bell" size={16} color={theme.textPrimary} />
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeLabel}>{badgeLabel}</Text>
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
    backgroundColor: lightTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: lightTheme.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    color: lightTheme.white,
  },
});
