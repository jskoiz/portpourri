import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../design/primitives';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
} from '../../design/sheets/AppBottomSheet';
import { useSheetController } from '../../design/sheets/useSheetController';
import { useTheme } from '../../theme/useTheme';
import { fieldStyles } from './fieldStyles';

export type SheetSelectOption = {
  label: string;
  value: string;
  description?: string;
};

export function SheetSelectField({
  disabled,
  error,
  helperText,
  label,
  onSelect,
  options,
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
  onSelect: (value: string) => void;
  options: SheetSelectOption[];
  placeholder: string;
  sheetSubtitle?: string;
  sheetTitle: string;
  testID?: string;
  value: string;
}) {
  const theme = useTheme();
  const sheet = useSheetController();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const triggerAccessibilityLabel = label
    ? `${label}: ${selectedOption?.label ?? placeholder}`
    : selectedOption?.label ?? placeholder;

  return (
    <View style={fieldStyles.wrapper}>
      {label ? <Text style={[fieldStyles.label, { color: theme.textMuted }]}>{label}</Text> : null}
      <Pressable
        accessibilityLabel={triggerAccessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        onPress={sheet.open}
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
                selectedOption ? fieldStyles.triggerValue : fieldStyles.triggerPlaceholder,
                { color: selectedOption ? theme.textPrimary : theme.textMuted },
              ]}
            >
              {selectedOption?.label ?? placeholder}
            </Text>
          </View>
          <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Select</Text>
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
        snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.form}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                sheet.close();
              }}
              style={[
                fieldStyles.optionCard,
                {
                  backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  fieldStyles.optionLabel,
                  { color: selected ? theme.primary : theme.textPrimary },
                ]}
              >
                {option.label}
              </Text>
              {option.description ? (
                <Text style={[fieldStyles.optionMeta, { color: theme.textMuted }]}>
                  {option.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
        <Button label="Cancel" onPress={sheet.close} variant="ghost" />
      </AppBottomSheet>
    </View>
  );
}
