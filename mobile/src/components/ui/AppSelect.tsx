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
import { lightTheme, radii, spacing, typography } from '../../theme/tokens';

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
  const triggerAccessibilityLabel = label
    ? `${label}: ${selectedOption?.label ?? placeholder}`
    : selectedOption?.label ?? placeholder;

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      ) : null}
      <Pressable
        accessibilityLabel={triggerAccessibilityLabel}
        accessibilityRole="button"
        accessibilityHint="Double tap to open dropdown"
        accessibilityState={{ expanded: open, disabled: disabled ?? false }}
        disabled={disabled}
        onPress={() => setOpen((current) => !current)}
        style={[
          styles.trigger,
          {
            borderColor: error ? theme.danger : open ? theme.primary : 'rgba(0,0,0,0.06)',
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
        <View style={styles.menu}>
          <ScrollView nestedScrollEnabled style={styles.menuScroll}>
            {options.length === 0 ? (
              <View style={styles.option}>
                <Text style={[styles.optionText, { color: theme.textMuted }]}>
                  No options available
                </Text>
              </View>
            ) : (
              options.map((option) => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityLabel={option.label}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}
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
              })
            )}
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
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: lightTheme.surface,
    shadowColor: lightTheme.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: lightTheme.surface,
    shadowColor: lightTheme.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
