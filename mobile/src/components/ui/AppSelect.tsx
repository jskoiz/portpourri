import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';

export interface AppSelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  label?: string;
  placeholder: string;
  options: AppSelectOption[];
  value: string;
  onSelect: (value: string) => void;
  error?: string;
  disabled?: boolean;
  wrapperStyle?: StyleProp<ViewStyle>;
  triggerStyle?: StyleProp<ViewStyle>;
}

export default function AppSelect({
  label,
  placeholder,
  options,
  value,
  onSelect,
  error,
  disabled,
  wrapperStyle,
  triggerStyle,
}: AppSelectProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen((current) => !current)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: error ? theme.danger : open ? theme.primary : theme.border,
          },
          triggerStyle,
          disabled && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selectedOption ? theme.textPrimary : theme.textMuted },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <Text style={[styles.chevron, { color: theme.textMuted }]}>
          {open ? '▲' : '▼'}
        </Text>
      </Pressable>

      {open ? (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: theme.surface,
              borderColor: error ? theme.danger : theme.border,
            },
          ]}
        >
          <ScrollView nestedScrollEnabled style={styles.menuScroll}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    selected && { backgroundColor: theme.primarySubtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? theme.primary : theme.textPrimary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {error ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  trigger: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    flex: 1,
    fontSize: typography.body,
    paddingRight: spacing.sm,
  },
  chevron: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  menu: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  menuScroll: {
    maxHeight: 220,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionText: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.48,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: 2,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
