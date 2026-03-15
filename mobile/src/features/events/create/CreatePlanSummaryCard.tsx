import React from 'react';
import { Text, View } from 'react-native';
import { Card, Chip } from '../../../design/primitives';
import { createStyles as styles } from './create.styles';

export function CreatePlanSummaryCard({
  selectedActivity,
  selectedColor,
  selectedTime,
  selectedWhen,
  where,
}: {
  selectedActivity: string;
  selectedColor: string;
  selectedTime: string;
  selectedWhen: string;
  where: string;
}) {
  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>Build the plan</Text>
        <Text style={[styles.planStepCount, { color: selectedColor }]}>
          {[selectedActivity, selectedWhen && selectedTime, where.trim()].filter(Boolean).length}/3
        </Text>
      </View>
      <View style={styles.planRow}>
        <View style={[styles.planPill, selectedActivity && styles.planPillActive]}>
          <Chip label={selectedActivity || 'Pick activity'} active={Boolean(selectedActivity)} interactive={false} />
        </View>
        <View style={styles.planPill}>
          <Chip
            label={selectedWhen && selectedTime ? `${selectedWhen} / ${selectedTime}` : 'Choose timing'}
            active={Boolean(selectedWhen && selectedTime)}
            interactive={false}
          />
        </View>
        <View style={styles.planPill}>
          <Chip label={where.trim() || 'Add location'} active={Boolean(where.trim())} interactive={false} />
        </View>
      </View>
    </Card>
  );
}
