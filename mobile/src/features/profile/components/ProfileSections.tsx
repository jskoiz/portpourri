import React from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import type { UserPhoto } from '../../../api/types';
import AppIcon from '../../../components/ui/AppIcon';
import { Button, Card, Chip } from '../../../design/primitives';
import { profileStyles as styles } from './profile.styles';
import type { PhotoOperationState } from '../hooks/useProfileEditor';
import { getVisibleOrderedPhotos } from '../hooks/profilePhotoHelpers';

export function TagPill({
  color = '#7C6AF7',
  interactive = true,
  label,
  onPress,
  selected,
}: {
  color?: string;
  interactive?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Chip
      onPress={onPress}
      label={label}
      active={selected}
      accentColor={color}
      interactive={interactive}
      style={styles.tagPill as any}
      textStyle={styles.tagPillText as any}
    />
  );
}

export function EditableField({
  editMode,
  inputProps,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  editMode: boolean;
  inputProps?: TextInputProps;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editMode ? (
        <TextInput
          style={[styles.fieldInput, multiline ? styles.fieldInputMultiline : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          autoCapitalize={multiline ? 'sentences' : 'none'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...inputProps}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: value ? '#1A1A1A' : '#94A3B8' }]}>
          {value || placeholder}
        </Text>
      )}
    </View>
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
  const uploadLabel = operation?.type === 'upload'
    ? operation.label
    : 'Upload a square photo. You can crop before it uploads.';

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
        ) : null}
        {visiblePhotos.map((photo, index) => (
          <Card key={photo.id} style={[styles.photoCard, operation?.photoId === photo.id ? styles.photoCardActive : null]}>
            <Image source={{ uri: photo.storageKey }} style={styles.photoImage} />
            <View style={styles.photoMeta}>
              <View style={styles.photoHeader}>
                <View style={styles.photoHeaderMeta}>
                  <Text style={styles.photoLabel}>{photo.isPrimary ? 'Primary photo' : `Photo ${index + 1}`}</Text>
                  <Text style={styles.photoSlotText}>{index === 0 ? 'Shows first in your profile' : 'Reorder to control what shows next'}</Text>
                </View>
                <View style={[styles.photoSlotPill, photo.isPrimary ? styles.photoPrimaryPill : null]}>
                  <Text style={[styles.photoSlotPillText, photo.isPrimary ? styles.photoPrimaryPillText : null]}>
                    {photo.isPrimary ? 'Primary' : `#${index + 1}`}
                  </Text>
                </View>
              </View>
              {operation?.photoId === photo.id ? (
                <View style={styles.photoInlineStatus}>
                  <AppIcon
                    name={operation.type === 'delete' ? 'trash-2' : operation.type === 'reorder' ? 'move' : 'star'}
                    size={14}
                    color="#7C6AF7"
                  />
                  <Text style={styles.photoInlineStatusText}>{operation.label}</Text>
                </View>
              ) : null}
              {canEdit ? (
                <View style={styles.photoActions}>
                  <Pressable disabled={isBusy || index === 0} onPress={() => onMoveLeft(photo.id)} style={styles.photoActionChip}>
                    <AppIcon name="arrow-left" size={14} color={isBusy || index === 0 ? 'rgba(0,0,0,0.2)' : '#64748B'} />
                    <Text style={[styles.photoActionText, isBusy || index === 0 ? styles.photoActionTextDisabled : null]}>Earlier</Text>
                  </Pressable>
                  <Pressable disabled={isBusy || index === visiblePhotos.length - 1} onPress={() => onMoveRight(photo.id)} style={styles.photoActionChip}>
                    <AppIcon name="arrow-right" size={14} color={isBusy || index === visiblePhotos.length - 1 ? 'rgba(0,0,0,0.2)' : '#64748B'} />
                    <Text style={[styles.photoActionText, isBusy || index === visiblePhotos.length - 1 ? styles.photoActionTextDisabled : null]}>Later</Text>
                  </Pressable>
                  {!photo.isPrimary ? (
                    <Pressable disabled={isBusy} onPress={() => onMakePrimary(photo.id)} style={styles.photoActionChip}>
                      <AppIcon name="star" size={14} color={isBusy ? 'rgba(0,0,0,0.2)' : '#64748B'} />
                      <Text style={[styles.photoActionText, isBusy ? styles.photoActionTextDisabled : null]}>Make primary</Text>
                    </Pressable>
                  ) : null}
                  <Pressable disabled={isBusy} onPress={() => onDelete(photo.id)} style={[styles.photoActionChip, styles.photoDeleteChip]}>
                    <AppIcon name="trash-2" size={14} color={isBusy ? 'rgba(239,68,68,0.34)' : '#EF4444'} />
                    <Text style={styles.photoDeleteText}>Remove</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </Card>
        ))}
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
