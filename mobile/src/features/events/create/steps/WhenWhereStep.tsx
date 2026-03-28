import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, screenLayout } from '../../../../design/primitives';
import { LocationField } from '../../../../components/form/LocationField';
import type { LocationSuggestion } from '../../../locations/locationSuggestions';
import { useTheme } from '../../../../theme/useTheme';
import { spacing, typography } from '../../../../theme/tokens';

type WhenWhereStepProps = {
  knownLocationSuggestions: LocationSuggestion[];
  onChangeLocation: (value: string) => void;
  onChangeStartsAt: (date: Date) => void;
  onNext: () => void;
  startsAt: Date;
  where: string;
};

function getMinDate() {
  const min = new Date();
  min.setMinutes(min.getMinutes() + 15);
  return min;
}

export function WhenWhereStep({
  knownLocationSuggestions,
  onChangeLocation,
  onChangeStartsAt,
  onNext,
  startsAt,
  where,
}: WhenWhereStepProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const minDate = getMinDate();
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');

  const canProceed = where.trim().length > 0 && startsAt > new Date();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            When and where?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pick a date, time, and spot.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DATE</Text>
          {Platform.OS === 'android' && !showDatePicker ? (
            <Button
              label={startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
              onPress={() => setShowDatePicker(true)}
              variant="secondary"
            />
          ) : (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={minDate}
              mode="date"
              onChange={(_, nextDate) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (!nextDate) return;
                const updated = new Date(startsAt);
                updated.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
                onChangeStartsAt(updated);
              }}
              value={startsAt}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TIME</Text>
          {Platform.OS === 'android' && !showTimePicker ? (
            <Button
              label={startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              onPress={() => setShowTimePicker(true)}
              variant="secondary"
            />
          ) : (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={minDate}
              mode="time"
              minuteInterval={5}
              onChange={(_, nextDate) => {
                if (Platform.OS === 'android') setShowTimePicker(false);
                if (!nextDate) return;
                const updated = new Date(startsAt);
                updated.setHours(nextDate.getHours(), nextDate.getMinutes(), 0, 0);
                onChangeStartsAt(updated);
              }}
              value={startsAt}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>LOCATION</Text>
          <LocationField
            knownSuggestions={knownLocationSuggestions}
            onChangeText={onChangeLocation}
            placeholder="Where are you meeting?"
            sheetTitle="Choose a spot"
            sheetSubtitle="Where should people show up?"
            value={where}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Next"
          onPress={onNext}
          disabled={!canProceed}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: screenLayout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: spacing.xl,
  },
});
