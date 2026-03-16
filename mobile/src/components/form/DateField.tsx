import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../design/primitives';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
} from '../../design/sheets/AppBottomSheet';
import { useSheetController } from '../../design/sheets/useSheetController';
import { useTheme } from '../../theme/useTheme';
import { fieldStyles } from './fieldStyles';

function formatDateValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  const parsed = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDateLabel(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function getDefaultDate() {
  const nextDate = new Date();
  nextDate.setFullYear(nextDate.getFullYear() - 21);
  return nextDate;
}

export function DateField({
  disabled,
  error,
  helperText,
  label,
  maximumDate,
  minimumDate,
  onChange,
  placeholder,
  sheetSubtitle,
  sheetTitle,
  testID,
  value,
}: {
  disabled?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  onChange: (value: string) => void;
  placeholder: string;
  sheetSubtitle?: string;
  sheetTitle: string;
  testID?: string;
  value: string;
}) {
  const theme = useTheme();
  const sheet = useSheetController();
  const [draftDate, setDraftDate] = useState<Date>(parseDateValue(value) ?? getDefaultDate());

  const displayValue = useMemo(() => formatDateLabel(value), [value]);
  const triggerAccessibilityLabel = label
    ? `${label}: ${displayValue || placeholder}`
    : displayValue || placeholder;

  const openPicker = () => {
    setDraftDate(parseDateValue(value) ?? getDefaultDate());
    sheet.open();
  };

  return (
    <View style={fieldStyles.wrapper}>
      {label ? <Text style={[fieldStyles.label, { color: theme.textMuted }]}>{label}</Text> : null}
      <Pressable
        accessibilityLabel={triggerAccessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        onPress={openPicker}
        style={[
          fieldStyles.trigger,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: error ? theme.danger : theme.border,
            opacity: disabled ? 0.48 : 1,
          },
        ]}
        testID={testID}
      >
        <View style={fieldStyles.triggerRow}>
          <View style={fieldStyles.triggerCopy}>
            <Text
              numberOfLines={1}
              style={[
                displayValue ? fieldStyles.triggerValue : fieldStyles.triggerPlaceholder,
                { color: displayValue ? theme.textPrimary : theme.textMuted },
              ]}
            >
              {displayValue || placeholder}
            </Text>
          </View>
          <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Pick</Text>
        </View>
      </Pressable>
      {error ? <Text style={[fieldStyles.errorText, { color: theme.danger }]}>{error}</Text> : null}
      {!error && helperText ? (
        <Text style={[fieldStyles.helperText, { color: theme.textMuted }]}>{helperText}</Text>
      ) : null}

      <AppBottomSheet
        {...sheet.sheetProps}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        scrollable={false}
        snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.compact}
      >
        <View style={fieldStyles.inputGroup}>
          <DateTimePicker
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            mode="date"
            onChange={(_, nextDate) => {
              if (!nextDate) return;
              setDraftDate(nextDate);
            }}
            testID="date-field-picker"
            value={draftDate}
          />
        </View>
        <View style={fieldStyles.actionRow}>
          <Button label="Cancel" onPress={sheet.close} variant="ghost" style={fieldStyles.actionButton} />
          <Button
            label="Done"
            onPress={() => {
              onChange(formatDateValue(draftDate));
              sheet.close();
            }}
            variant="primary"
            style={fieldStyles.actionButton}
          />
        </View>
      </AppBottomSheet>
    </View>
  );
}

export { formatDateLabel };
