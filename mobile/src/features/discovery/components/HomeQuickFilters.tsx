import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppIcon from '../../../components/ui/AppIcon';
import { Chip } from '../../../design/primitives';
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
  return (
    <View style={styles.filterBar}>
      <View style={styles.filterBarHeader}>
        <Text style={styles.filterBarLabel}>Quick filters</Text>
        <Pressable onPress={onPressRefine} style={styles.refineTrigger}>
          <AppIcon
            name="sliders"
            size={14}
            color={activeFilterCount > 0 ? '#34D399' : 'rgba(240,246,252,0.45)'}
          />
          <Text
            style={[
              styles.refineTriggerText,
              { color: activeFilterCount > 0 ? '#34D399' : 'rgba(240,246,252,0.45)' },
            ]}
          >
            {activeFilterCount > 0 ? `Refine (${activeFilterCount})` : 'Refine'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsRow}
        style={styles.filterPillsScroll}
      >
        {QUICK_FILTERS.map((filter) => {
          const active = activeQuickFilter === filter.id;

          return (
            <Chip
              key={filter.id}
              onPress={() => onPressFilter(filter.id)}
              style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive] as any}
              label={filter.label}
              active={active}
              accentColor="#7C6AF7"
              textStyle={styles.filterPillText as any}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
