import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { UserPhoto } from '../../../api/types';
import AppIcon from '../../../components/ui/AppIcon';
import { Button, Card } from '../../../design/primitives';
import type { PhotoOperationState } from '../hooks/usePhotoManager';
import { getVisibleOrderedPhotos } from '../hooks/profilePhotoHelpers';
import { profileStyles as styles } from './profile.styles';

function PhotoActionButton({
  destructive = false,
  disabled,
  icon,
  label,
  onPress,
}: {
  destructive?: boolean;
  disabled: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const iconColor = destructive
    ? disabled ? 'rgba(201,112,112,0.34)' : '#C97070'
    : disabled ? 'rgba(0,0,0,0.22)' : '#5C544C';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={[
        styles.photoActionButton,
        destructive ? styles.photoActionButtonDanger : null,
        disabled ? styles.photoActionButtonDisabled : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <AppIcon name={icon} size={16} color={iconColor} />
    </Pressable>
  );
}

export function PhotoManager({
  canEdit,
  isBusy,
  onDelete,
  onMakePrimary,
  onMoveLeft,
  onMoveRight,
  onUpload,
  operation,
  photos,
}: {
  canEdit: boolean;
  isBusy: boolean;
  onDelete: (photoId: string) => void;
  onMakePrimary: (photoId: string) => void;
  onMoveLeft: (photoId: string) => void;
  onMoveRight: (photoId: string) => void;
  onUpload: () => void;
  operation: PhotoOperationState;
  photos: UserPhoto[];
}) {
  const visiblePhotos = getVisibleOrderedPhotos(photos);
  const primaryPhoto = visiblePhotos.find((photo) => photo.isPrimary) ?? visiblePhotos[0];
  const secondaryPhotos = primaryPhoto
    ? visiblePhotos.filter((photo) => photo.id !== primaryPhoto.id)
    : [];
  const uploadLabel = operation?.type === 'upload'
    ? operation.label
    : 'Upload a square photo. You can crop before it uploads.';

  const renderPhotoCard = (
    photo: UserPhoto,
    orderedIndex: number,
    isFeaturedCard = false,
  ) => {
    const isPrimaryPhoto = photo.isPrimary;
    const isActive = operation?.photoId === photo.id;
    const slotLabel = isPrimaryPhoto ? 'Primary photo' : `Photo ${orderedIndex + 1}`;
    const slotDescription = isPrimaryPhoto
      ? 'Shows first in your profile'
      : 'Order decides what shows next';

    return (
      <View
        key={photo.id}
        style={[
          styles.photoGalleryCardShell,
          isFeaturedCard
            ? styles.photoGalleryCardShellPrimary
            : styles.photoGalleryCardShellSecondary,
          isActive ? styles.photoCardActive : null,
        ]}
      >
        <View style={styles.photoGalleryCard}>
          <View style={styles.photoMedia}>
            <Image
              source={{ uri: photo.storageKey }}
              style={[
                styles.photoGalleryImage,
                isFeaturedCard
                  ? styles.photoGalleryImagePrimary
                  : styles.photoGalleryImageSecondary,
              ]}
            />
            <View style={styles.photoBadgeRow}>
              <View style={[styles.photoSlotPill, isPrimaryPhoto ? styles.photoPrimaryPill : null]}>
                <Text style={[styles.photoSlotPillText, isPrimaryPhoto ? styles.photoPrimaryPillText : null]}>
                  {isPrimaryPhoto ? 'Primary' : `#${orderedIndex + 1}`}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.photoMeta}>
            <View style={styles.photoHeaderMeta}>
              <Text style={styles.photoLabel}>{slotLabel}</Text>
              <Text style={styles.photoSlotText}>{slotDescription}</Text>
            </View>
            {isActive ? (
              <View style={styles.photoInlineStatus}>
                <AppIcon
                  name={operation.type === 'delete' ? 'trash-2' : operation.type === 'reorder' ? 'move' : 'star'}
                  size={14}
                  color="#C4A882"
                />
                <Text style={styles.photoInlineStatusText}>{operation.label}</Text>
              </View>
            ) : null}
            {canEdit ? (
              <View style={styles.photoActionsCompact}>
                <PhotoActionButton
                  disabled={isBusy || orderedIndex === 0}
                  icon="arrow-left"
                  label="Move photo earlier"
                  onPress={() => onMoveLeft(photo.id)}
                />
                <PhotoActionButton
                  disabled={isBusy || orderedIndex === visiblePhotos.length - 1}
                  icon="arrow-right"
                  label="Move photo later"
                  onPress={() => onMoveRight(photo.id)}
                />
                {!isPrimaryPhoto ? (
                  <PhotoActionButton
                    disabled={isBusy}
                    icon="star"
                    label="Make primary photo"
                    onPress={() => onMakePrimary(photo.id)}
                  />
                ) : null}
                <PhotoActionButton
                  destructive
                  disabled={isBusy}
                  icon="trash-2"
                  label="Remove photo"
                  onPress={() => onDelete(photo.id)}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.photoManager}>
      <View style={styles.photoIntro}>
        <Text style={styles.photoIntroTitle}>Lead with a clear first photo</Text>
        <Text style={styles.photoIntroBody}>{uploadLabel}</Text>
        {operation?.type === 'upload' ? (
          <View style={styles.photoProgressTrack}>
            <View style={[styles.photoProgressFill, { width: `${Math.max(operation.progress, 6)}%` }]} />
          </View>
        ) : null}
      </View>
      <View style={styles.photoGrid}>
        {visiblePhotos.length === 0 ? (
          <Card style={styles.photoEmptyCard}>
            <Text style={styles.photoEmptyTitle}>No photos yet</Text>
            <Text style={styles.photoEmptyBody}>Add one strong headshot first, then use the rest to show movement and context.</Text>
          </Card>
        ) : (
          <>
            {primaryPhoto ? renderPhotoCard(primaryPhoto, visiblePhotos.indexOf(primaryPhoto), true) : null}
            {secondaryPhotos.length > 0 ? (
              <View style={styles.photoSecondaryGrid}>
                {secondaryPhotos.map((photo) =>
                  renderPhotoCard(photo, visiblePhotos.indexOf(photo)),
                )}
              </View>
            ) : null}
          </>
        )}
      </View>
      {canEdit ? (
        <Button
          label={operation?.type === 'upload' ? operation.label : isBusy ? 'Working…' : 'Add photo'}
          onPress={onUpload}
          disabled={isBusy}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}
