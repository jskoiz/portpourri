import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { EventSummary } from '../../api/types';
import { Button, Input } from '../../design/primitives';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
} from '../../design/sheets/AppBottomSheet';
import { useSheetController } from '../../design/sheets/useSheetController';
import { queryKeys } from '../../lib/query/queryKeys';
import { useTheme } from '../../theme/useTheme';
import { fieldStyles } from './fieldStyles';
import {
  type LocationSuggestion,
  extractKnownLocationSuggestions,
  getCuratedLocationSuggestions,
  loadRecentLocationSuggestions,
  normalizeLocationValue,
  rankLocationSuggestions,
  saveRecentLocationSuggestion,
} from '../../features/locations/locationSuggestions';

function buildManualSuggestion(query: string): LocationSuggestion {
  const normalized = normalizeLocationValue(query);
  return {
    id: `manual:${normalized.toLowerCase()}`,
    label: normalized,
    value: normalized,
    source: 'manual',
  };
}

export function LocationField({
  disabled,
  error,
  helperText,
  kind = 'place',
  label,
  onChangeText,
  onSelectSuggestion,
  placeholder,
  sheetSubtitle,
  sheetTitle,
  testID,
  value,
}: {
  disabled?: boolean;
  error?: string;
  helperText?: string;
  kind?: 'place' | 'city';
  label?: string;
  onChangeText: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  placeholder: string;
  sheetSubtitle?: string;
  sheetTitle: string;
  testID?: string;
  value: string;
}) {
  const theme = useTheme();
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = null;
  }
  const sheet = useSheetController();
  const [query, setQuery] = useState(value);
  const [recentSuggestions, setRecentSuggestions] = useState<LocationSuggestion[]>([]);

  useEffect(() => {
    void loadRecentLocationSuggestions().then(setRecentSuggestions);
  }, []);

  const cachedEventLocations = useMemo(() => {
    const eventsList = queryClient?.getQueryData<EventSummary[]>(queryKeys.events.list) ?? [];
    const mine = queryClient?.getQueryData<EventSummary[]>(queryKeys.events.mine) ?? [];
    return extractKnownLocationSuggestions([...eventsList, ...mine]);
  }, [queryClient]);

  const suggestions = useMemo(() => {
    return rankLocationSuggestions(query, [
      ...recentSuggestions,
      ...cachedEventLocations,
      ...getCuratedLocationSuggestions(kind),
    ]);
  }, [cachedEventLocations, kind, query, recentSuggestions]);

  const normalizedQuery = normalizeLocationValue(query);
  const hasExactMatch = suggestions.some(
    (suggestion) => suggestion.value.toLowerCase() === normalizedQuery.toLowerCase(),
  );

  const commitSelection = (suggestion: LocationSuggestion) => {
    onChangeText(suggestion.value);
    onSelectSuggestion?.(suggestion);
    void saveRecentLocationSuggestion(suggestion).then(async () => {
      const nextRecents = await loadRecentLocationSuggestions();
      setRecentSuggestions(nextRecents);
    });
    sheet.close();
  };

  const openPicker = () => {
    setQuery(value);
    sheet.open();
  };

  return (
    <View style={fieldStyles.wrapper}>
      {label ? <Text style={[fieldStyles.label, { color: theme.textMuted }]}>{label}</Text> : null}
      <Pressable
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
                value ? fieldStyles.triggerValue : fieldStyles.triggerPlaceholder,
                { color: value ? theme.textPrimary : theme.textMuted },
              ]}
            >
              {value || placeholder}
            </Text>
          </View>
          <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Browse</Text>
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
        <Input
          autoCapitalize={kind === 'city' ? 'words' : 'words'}
          autoCorrect={false}
          label={kind === 'city' ? 'City' : 'Location'}
          onChangeText={setQuery}
          placeholder={placeholder}
          returnKeyType="done"
          value={query}
        />
        {normalizedQuery && !hasExactMatch ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              commitSelection(buildManualSuggestion(normalizedQuery));
            }}
            style={[
              fieldStyles.optionCard,
              {
                backgroundColor: theme.primarySubtle,
                borderColor: theme.primary,
              },
            ]}
          >
            <Text style={[fieldStyles.optionLabel, { color: theme.primary }]}>
              Use "{normalizedQuery}"
            </Text>
            <Text style={[fieldStyles.optionMeta, { color: theme.textMuted }]}>
              Keep the exact text you typed.
            </Text>
          </Pressable>
        ) : null}
        {suggestions.map((suggestion) => (
          <Pressable
            accessibilityRole="button"
            key={suggestion.id}
            onPress={() => {
              commitSelection(suggestion);
            }}
            style={[
              fieldStyles.optionCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[fieldStyles.optionLabel, { color: theme.textPrimary }]}>
              {suggestion.label}
            </Text>
            <Text style={[fieldStyles.optionMeta, { color: theme.textMuted }]}>
              {suggestion.secondaryLabel ??
                (suggestion.source === 'recent'
                  ? 'Recent selection'
                  : suggestion.source === 'known'
                    ? 'Known from BRDG activity'
                    : 'Suggested place')}
            </Text>
          </Pressable>
        ))}
        {!suggestions.length && !normalizedQuery ? (
          <View style={fieldStyles.searchEmpty}>
            <Text style={[fieldStyles.searchEmptyTitle, { color: theme.textPrimary }]}>
              Start typing to search
            </Text>
            <Text style={[fieldStyles.searchEmptyBody, { color: theme.textMuted }]}>
              Recent places and curated BRDG-friendly suggestions will appear here.
            </Text>
          </View>
        ) : null}
        <View style={fieldStyles.actionRow}>
          <Button label="Cancel" onPress={sheet.close} variant="ghost" style={fieldStyles.actionButton} />
          <Button
            disabled={!normalizedQuery}
            label="Use current text"
            onPress={() => {
              if (!normalizedQuery) return;
              commitSelection(buildManualSuggestion(normalizedQuery));
            }}
            style={fieldStyles.actionButton}
            variant="primary"
          />
        </View>
      </AppBottomSheet>
    </View>
  );
}
