import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import { homeStyles as styles } from './home.styles';
import { QUICK_FILTERS, type QuickFilterKey } from './discoveryFilters';

export function HomeQuickFilters({
  activeFilterCount,
  activeQuickFilter,
  onPressFilter,
  onPressRefine,
}: {
  activeFilterCount: number;
  activeQuickFilter: QuickFilterKey;
  onPressFilter: (filterId: QuickFilterKey) => void;
  onPressRefine: () => void;
}) {
  const refineLabel = activeFilterCount > 0 ? `Filters ${activeFilterCount}` : 'Filters';

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsRow}
        style={styles.filterPillsScroll}
      >
        <Pressable onPress={onPressRefine} style={styles.refineTrigger}>
          <AppIcon
            name="sliders"
            size={14}
            color={activeFilterCount > 0 ? '#2C2420' : '#B0A89E'}
          />
          <Text
            style={[
              styles.refineTriggerText,
              { color: activeFilterCount > 0 ? '#2C2420' : '#B0A89E' },
            ]}
          >
            {refineLabel}
          </Text>
        </Pressable>

        {QUICK_FILTERS.map((filter) => {
          const active = activeQuickFilter === filter.id;

          return (
            <Pressable
              key={filter.id}
              onPress={() => onPressFilter(filter.id)}
              style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
