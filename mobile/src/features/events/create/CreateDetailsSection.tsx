import React from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
}: {
  control: Control<CreateEventFormValues>;
  errors: Partial<Record<keyof CreateEventFormValues, { message?: string }>>;
  isSubmitting: boolean;
  noteInputFocus: () => void;
  onChangeSpots: (value: number) => void;
  onClearError: () => void;
  spots: number;
}) {
  return (
    <>
      <View style={styles.formSection}>
        <SectionLabel label="Where?" />
        <Controller
          control={control}
          name="where"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              style={styles.textInput}
              placeholder="Runyon Canyon, Venice Beach..."
              placeholderTextColor="rgba(240,246,252,0.38)"
              value={value}
              onBlur={onBlur}
              onChangeText={(nextValue) => {
                onClearError();
                onChange(nextValue);
              }}
              returnKeyType="done"
            />
          )}
        />
        {errors.where?.message ? <Text style={styles.inlineError}>{errors.where.message}</Text> : null}
      </View>

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

      <View style={styles.formSection}>
        <SectionLabel label="Add a note" />
        <Controller
          control={control}
          name="note"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Easy pace, bring water, no experience needed..."
              placeholderTextColor="rgba(240,246,252,0.38)"
              value={value}
              onBlur={onBlur}
              onChangeText={(nextValue) => {
                onClearError();
                onChange(nextValue);
              }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={noteInputFocus}
              blurOnSubmit
            />
          )}
        />
        {errors.note?.message ? <Text style={styles.inlineError}>{errors.note.message}</Text> : null}
      </View>
    </>
  );
}

