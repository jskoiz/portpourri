import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { createStyles as styles } from './create.styles';
import { formatTimingSummary } from './create.helpers';

export function CreatePlanSummaryCard({
  selectedActivity,
  selectedColor: _selectedColor,
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
  const theme = useTheme();
  const timingValue = selectedWhen || selectedTime ? formatTimingSummary(selectedWhen, selectedTime) : '';
  const steps = [
    { key: 'activity', label: 'Pick activity', value: selectedActivity, isComplete: Boolean(selectedActivity) },
    {
      key: 'timing',
      label: 'Choose timing',
      value: timingValue,
      isComplete: Boolean(selectedWhen && selectedTime),
    },
    { key: 'location', label: 'Add location', value: where.trim(), isComplete: Boolean(where.trim()) },
  ];
  const completedCount = steps.filter((step) => step.isComplete).length;
  const currentStepIndex = steps.findIndex((step) => !step.isComplete);
  const activeIndex = currentStepIndex === -1 ? steps.length - 1 : currentStepIndex;

  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planHeaderCopy}>
          <Text style={styles.planTitle}>Build the plan</Text>
          <Text style={[styles.planMeta, { color: theme.textSecondary }]}>
            Lead with the next move and let the rest fall behind it.
          </Text>
        </View>
        <Text style={[styles.planStepCount, { color: theme.accentPrimary }]}>
          {completedCount}/3
        </Text>
      </View>
      <View style={styles.planStack}>
        {steps.map((step, index) => {
          const isCompleted = step.isComplete;
          const isActive = index === activeIndex;
          return (
            <View
              key={step.key}
              style={[
                styles.planStep,
                isActive ? styles.planStepActive : null,
                { backgroundColor: isActive ? theme.accentSoft : theme.chipSurface },
              ]}
            >
              <View style={[styles.planStepMarker, { backgroundColor: isActive ? theme.surface : theme.background }]}>
                <Text style={[styles.planStepNumber, { color: isActive ? theme.accentPrimary : theme.textMuted }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.planStepCopy}>
                <Text style={[styles.planStepLabel, { color: isActive ? theme.textPrimary : theme.textSecondary }]}>
                  {step.label}
                </Text>
                <Text style={[styles.planStepValue, { color: isCompleted ? theme.textPrimary : theme.textMuted }]}>
                  {step.value || (isActive ? 'Next up' : 'Waiting')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
