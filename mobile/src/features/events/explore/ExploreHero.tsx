import React from 'react';
import { Text, View } from 'react-native';
import AppNotificationButton from '../../../components/ui/AppNotificationButton';
import { exploreStyles as styles } from './explore.styles';

export function ExploreHero({
  onPressNotifications,
  unreadCount,
}: {
  onPressNotifications: () => void;
  unreadCount: number;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroHeaderRow}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>CITY GUIDE / CURATED MOVEMENT</Text>
          <Text style={styles.heroTitle}>What&apos;s{'\n'}happening.</Text>
          <Text style={styles.heroSubtitle}>A cleaner browse with stronger editorial framing.</Text>
        </View>
        <AppNotificationButton
          unreadCount={unreadCount}
          onPress={onPressNotifications}
          style={styles.heroNotificationButton}
        />
      </View>
    </View>
  );
}

