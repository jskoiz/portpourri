import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import AppNotificationButton from '../../../components/ui/AppNotificationButton';
import { fontFamily } from '../../../lib/fonts';
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
          <Text style={styles.heroEyebrow}>EXPLORE</Text>
          <Text style={[styles.heroTitle, { fontFamily: fontFamily.serifBold, letterSpacing: -0.5 }]} accessibilityRole="header">What&apos;s{'\n'}nearby.</Text>
          <Text style={styles.heroSubtitle}>Events, spots, and people near you.</Text>
        </View>
        <AppNotificationButton
          unreadCount={unreadCount}
          onPress={onPressNotifications}
          style={styles.heroNotificationButton}
        />
        <Pressable
          onPress={onOpenQuickActions}
          style={[styles.heroActionButton, { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }]}
          accessibilityRole="button"
          accessibilityLabel="Quick actions"
          accessibilityHint="Opens explore options menu"
        >
          <AppIcon name="sliders" size={16} color="#2C2420" />
        </Pressable>
      </View>
    </View>
  );
}
