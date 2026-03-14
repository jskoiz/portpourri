import React from 'react';
import { Text, View } from 'react-native';
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
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>Build the plan</Text>
        <Text style={[styles.planStepCount, { color: selectedColor }]}>
          {[selectedActivity, selectedWhen && selectedTime, where.trim()].filter(Boolean).length}/3
        </Text>
      </View>
      <View style={styles.planRow}>
        <View style={[styles.planPill, selectedActivity && styles.planPillActive]}>
          <Text style={[styles.planPillLabel, selectedActivity && styles.planPillLabelActive]}>
            {selectedActivity || 'Pick activity'}
          </Text>
        </View>
        <View style={[styles.planPill, selectedWhen && selectedTime && styles.planPillActive]}>
          <Text style={[styles.planPillLabel, selectedWhen && selectedTime && styles.planPillLabelActive]}>
            {selectedWhen && selectedTime ? `${selectedWhen} / ${selectedTime}` : 'Choose timing'}
          </Text>
        </View>
        <View style={[styles.planPill, where.trim() && styles.planPillActive]}>
          <Text style={[styles.planPillLabel, where.trim() && styles.planPillLabelActive]}>
            {where.trim() || 'Add location'}
          </Text>
        </View>
      </View>
    </View>
  );
}

