import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import AppNotificationButton from '../../../components/ui/AppNotificationButton';
import { exploreStyles as styles } from './explore.styles';

export function ExploreHero({
  onOpenQuickActions,
  onPressNotifications,
  unreadCount,
}: {
  onOpenQuickActions: () => void;
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
        <Pressable onPress={onOpenQuickActions} style={styles.heroActionButton}>
          <AppIcon name="sliders" size={16} color="#2C2420" />
        </Pressable>
      </View>
    </View>
  );
}
