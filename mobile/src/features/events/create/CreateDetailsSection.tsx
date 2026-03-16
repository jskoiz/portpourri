import React from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Text, TouchableOpacity, View } from 'react-native';
import { LocationField } from '../../../components/form/LocationField';
import { Input } from '../../../design/primitives';
import type { CreateEventFormValues } from '../schema';
import { createStyles as styles } from './create.styles';

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export function CreateDetailsSection({
  control,
  errors,
  isSubmitting,
  noteInputFocus,
  onChangeSpots,
  onClearError,
  spots,
  hideSpots = false,
}: {
  control: Control<CreateEventFormValues>;
  errors: Partial<Record<keyof CreateEventFormValues, { message?: string }>>;
  isSubmitting: boolean;
  noteInputFocus: () => void;
  onChangeSpots: (value: number) => void;
  onClearError: () => void;
  spots: number;
  hideSpots?: boolean;
}) {
  return (
    <>
      <View style={styles.formSection}>
        <SectionLabel label="Where?" />
        <Controller
          control={control}
          name="where"
          render={({ field: { onChange, value } }) => (
            <LocationField
              kind="place"
              label="Where"
              placeholder="Runyon Canyon, Venice Beach..."
              value={value}
              onChangeText={(nextValue) => {
                onClearError();
                onChange(nextValue);
              }}
              error={errors.where?.message}
              sheetTitle="Choose a location"
              sheetSubtitle="Search recent, known, or curated BRDG-friendly places, or keep the text you type."
            />
          )}
        />
      </View>

      {!hideSpots ? (
      <View style={styles.formSection}>
        <SectionLabel label="Spots available" />
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => onChangeSpots(Math.max(1, spots - 1))}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.stepperBtnText}>-</Text>
          </TouchableOpacity>
          <View style={styles.stepperValueWrap}>
            <Text style={styles.stepperValue}>{spots}</Text>
            <Text style={styles.stepperSub}>open spots</Text>
          </View>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => onChangeSpots(Math.min(10, spots + 1))}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : null}

      <View style={styles.formSection}>
        <SectionLabel label="Add a note" />
        <Controller
          control={control}
          name="note"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              style={[styles.textInput, styles.textArea]}
              placeholder="Easy pace, bring water, no experience needed..."
              value={value}
              onBlur={onBlur}
              onChangeText={(nextValue) => {
                onClearError();
                onChange(nextValue);
              }}
              multiline
              numberOfLines={3}
              onFocus={noteInputFocus}
              blurOnSubmit
              autoCapitalize="sentences"
              autoCorrect
              maxLength={280}
            />
          )}
        />
        {errors.note?.message ? <Text style={styles.inlineError}>{errors.note.message}</Text> : null}
      </View>
    </>
  );
}
