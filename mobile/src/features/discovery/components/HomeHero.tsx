import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppNotificationButton from '../../../components/ui/AppNotificationButton';
import { fontFamily } from '../../../lib/fonts';
import { homeStyles as styles } from './home.styles';

type IntentOption = {
  color: string;
  label: string;
};

export function HomeHero({
  feedCount,
  filterCount,
  greeting,
  intentOption,
  onPressNotifications,
  unreadCount,
}: {
  feedCount: number;
  filterCount: number;
  greeting: string;
  intentOption: IntentOption;
  onPressNotifications: () => void;
  unreadCount: number;
}) {
  const rawTimeWord = greeting.split(/[,\s]/)[0]?.trim() || 'Tonight';
  const timeLabel = rawTimeWord.toUpperCase();
  const headingLabel = rawTimeWord.charAt(0).toUpperCase() + rawTimeWord.slice(1).toLowerCase();
  const summaryLabel =
    filterCount > 0 ? `${feedCount} people · ${filterCount} filters` : `${feedCount} people nearby`;

  return (
    <View style={styles.topBar}>
      <View style={styles.heroHeaderRow}>
        <View style={styles.headerCopy} accessibilityRole="header">
          <Text style={styles.greetingEyebrow} importantForAccessibility="no">{timeLabel}</Text>
          <Text style={[styles.greeting, { fontFamily: fontFamily.serifBold }]}>{greeting}</Text>
        </View>

        <AppNotificationButton
          testID="notifications-button"
          unreadCount={unreadCount}
          onPress={onPressNotifications}
          style={styles.notificationButton}
        />
      </View>

      <View style={styles.heroSummaryRow} accessibilityLabel={`${intentOption.label}. ${summaryLabel}`}>
        <View style={styles.intentBadgeWrap} importantForAccessibility="no">
          <LinearGradient
            colors={[intentOption.color + '14', intentOption.color + '08']}
            style={styles.intentBadge}
          >
            <Text style={[styles.intentBadgeText, { color: intentOption.color }]}>
              {intentOption.label}
            </Text>
          </LinearGradient>
        </View>

        <Text style={styles.heroSummaryText} importantForAccessibility="no">{summaryLabel}</Text>
      </View>
    </View>
  );
}
