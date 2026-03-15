import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppNotificationButton from '../../../components/ui/AppNotificationButton';
import { Card } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
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
  const theme = useTheme();

  return (
    <View style={styles.topBar}>
      <Card
        style={[
          styles.heroPanel,
          { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
        ]}
      >
        <View style={styles.heroPanelHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.greetingEyebrow}>{greeting.toUpperCase()} / INTENT-AWARE</Text>
            <Text style={styles.greeting}>Tonight&apos;s people.</Text>
            <Text style={styles.greetingSub}>Fewer choices up front. Better matches in focus.</Text>
          </View>

          <View style={styles.headerActions}>
            <AppNotificationButton unreadCount={unreadCount} onPress={onPressNotifications} />
            <View style={styles.intentBadgeWrap}>
              <LinearGradient
                colors={[intentOption.color + '55', intentOption.color + '22']}
                style={styles.intentBadge}
              >
                <Text style={[styles.intentBadgeText, { color: intentOption.color }]}>
                  {intentOption.label}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={styles.heroMetricsRow}>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>Feed</Text>
            <Text style={styles.heroMetricValue}>{feedCount} profiles</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>Filters</Text>
            <Text style={styles.heroMetricValue}>
              {filterCount > 0 ? `${filterCount} active` : 'Minimal'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
