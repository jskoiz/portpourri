import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from '../../../design/primitives';
import { CATEGORIES, type ExploreCategory } from './explore.data';
import { exploreStyles as styles } from './explore.styles';

export function ExploreCategoryBar({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: ExploreCategory;
  onSelectCategory: (category: ExploreCategory) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesRow}
      style={styles.categoriesScroll}
    >
      {CATEGORIES.map((category) => {
        const active = activeCategory === category;

        return (
          <Chip
            key={category}
            style={[styles.categoryPill, active ? styles.categoryPillActive : styles.categoryPillInactive] as any}
            onPress={() => onSelectCategory(category)}
            active={active}
            label={category}
            accentColor="#7C6AF7"
            textStyle={[styles.categoryPillText, { color: active ? '#7C6AF7' : '#94A3B8' }] as any}
          />
        );
      })}
    </ScrollView>
  );
}
