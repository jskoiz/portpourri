import React from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { UserPhoto } from '../../../api/types';
import { getVisibleOrderedPhotos } from '../hooks/profilePhotoHelpers';
import { useTheme } from '../../../theme/useTheme';
import { radii, spacing } from '../../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STRIP_PADDING = spacing.xxl;
const PHOTO_GAP = spacing.sm;
const PHOTO_SIZE = (SCREEN_WIDTH - STRIP_PADDING * 2 - PHOTO_GAP * 2) / 3;

export function ProfilePhotoStrip({
  onPress,
  photos,
}: {
  onPress?: () => void;
  photos: UserPhoto[];
}) {
  const theme = useTheme();
  const visiblePhotos = getVisibleOrderedPhotos(photos);

  if (visiblePhotos.length <= 1) return null;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Edit photos">
      <FlatList
        data={visiblePhotos.slice(1)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.photoWrap, { backgroundColor: theme.subduedSurface }]}>
            <Image
              source={{ uri: item.storageKey }}
              style={styles.photo}
              contentFit="cover"
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: STRIP_PADDING,
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  separator: {
    width: PHOTO_GAP,
  },
});
