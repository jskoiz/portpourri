import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
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
          <TouchableOpacity
            key={category}
            style={[styles.categoryPill, active ? styles.categoryPillActive : styles.categoryPillInactive]}
            onPress={() => onSelectCategory(category)}
            activeOpacity={0.8}
          >
            <Text style={[styles.categoryPillText, { color: active ? '#FFFFFF' : 'rgba(240,246,252,0.38)' }]}>
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

