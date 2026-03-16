import React from 'react';
import { Text, View } from 'react-native';
import { Button, Chip } from '../../../design/primitives';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
  type AppBottomSheetProps,
} from '../../../design/sheets/AppBottomSheet';
import type { ExploreCategory } from './explore.data';
import { CATEGORIES } from './explore.data';
import { exploreStyles as styles } from './explore.styles';

export function ExploreQuickActionsSheet({
  activeCategory,
  controller,
  onClose,
  onOpenCreate,
  onOpenMyEvents,
  onSelectCategory,
}: {
  activeCategory: ExploreCategory;
  controller: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  onClose: () => void;
  onOpenCreate: () => void;
  onOpenMyEvents: () => void;
  onSelectCategory: (category: ExploreCategory) => void;
}) {
  return (
    <AppBottomSheet
      {...controller}
      title="Explore actions"
      subtitle="Jump between browse modes and event actions."
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.standard}
    >
      <View>
        <Text style={styles.sheetSectionLabel}>Category</Text>
        <View style={styles.sheetChipWrap}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={category}
              active={activeCategory === category}
              onPress={() => onSelectCategory(category)}
              accentColor="#7C6AF7"
            />
          ))}
        </View>
      </View>
      <View style={styles.sheetActionStack}>
        <Button
          label="Create event"
          onPress={() => {
            onClose();
            onOpenCreate();
          }}
          variant="accent"
        />
        <Button
          label="My events"
          onPress={() => {
            onClose();
            onOpenMyEvents();
          }}
          variant="secondary"
        />
      </View>
    </AppBottomSheet>
  );
}
