import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIcon from '../../../components/ui/AppIcon';
import { createStyles as styles } from './create.styles';
import { ACTIVITY_TYPES } from './create.helpers';

function ActivityTile({
  activity,
  selected,
  onPress,
}: {
  activity: (typeof ACTIVITY_TYPES)[number];
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.activityTileWrap}>
      <View
        style={[
          styles.activityTile,
          selected
            ? { borderColor: activity.color, backgroundColor: activity.color + '20' }
            : { borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#F7F4F0' },
        ]}
      >
        <AppIcon
          name={activity.icon}
          size={20}
          color={selected ? activity.color : 'rgba(240,246,252,0.38)'}
        />
      </View>
      <Text style={[styles.activityLabel, { color: selected ? activity.color : 'rgba(240,246,252,0.38)' }]}>
        {activity.label}
      </Text>
    </Pressable>
  );
}

export function CreateActivityPicker({
  onSelectActivity,
  selectedActivity,
}: {
  onSelectActivity: (activity: string) => void;
  selectedActivity: string;
}) {
  const activityObj = ACTIVITY_TYPES.find((activity) => activity.label === selectedActivity);

  return (
    <View style={styles.activitySection}>
      {activityObj ? (
        <View style={styles.selectedPreview}>
          <LinearGradient
            colors={[activityObj.color + '40', activityObj.color + '10', 'transparent']}
            style={styles.selectedPreviewGradient}
          >
            <View style={[styles.selectedPreviewIconWrap, { backgroundColor: activityObj.color + '16' }]}>
              <AppIcon name={activityObj.icon} size={24} color={activityObj.color} />
            </View>
            <View style={styles.selectedPreviewText}>
              <Text style={[styles.selectedPreviewEyebrow, { color: activityObj.color }]}>ACTIVITY</Text>
              <Text style={styles.selectedPreviewLabel}>{activityObj.label}</Text>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <Text style={styles.activityPrompt}>Start with the anchor activity.</Text>
      )}

      <View style={styles.activityGrid}>
        {ACTIVITY_TYPES.map((activity) => (
          <ActivityTile
            key={activity.label}
            activity={activity}
            selected={selectedActivity === activity.label}
            onPress={() => onSelectActivity(activity.label)}
          />
        ))}
      </View>
    </View>
  );
}

