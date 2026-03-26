import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import {
  EditableField,
  PhotoManager,
  TagPill,
} from '../features/profile/components/ProfileSections';
import type { PhotoOperationState } from '../features/profile/hooks/usePhotoManager';
import { withStorySurface, makeUser, makeUserPhoto } from './support';

function ProfileSectionsStory({
  editMode,
  photoCount,
  photoOperation,
}: {
  editMode: boolean;
  photoCount: number;
  photoOperation: PhotoOperationState;
}) {
  const normalizedPhotoCount = Number.isFinite(photoCount)
    ? Math.max(0, Math.floor(photoCount))
    : 0;
  const profile = makeUser({
    photos: Array.from({ length: normalizedPhotoCount }, (_, index) => makeUserPhoto({
      id: `photo-${index + 1}`,
      isPrimary: index === 0,
      sortOrder: index,
    })),
  });

  return (
    <View style={{ gap: 24 }}>
      <EditableField
        editMode={editMode}
        label="Bio"
        multiline
        onChangeText={() => undefined}
        placeholder="Tell people what kind of movement and company you want."
        value="Sunrise movement, low-pressure plans, and good pacing."
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <TagPill color="#D4A59A" interactive={editMode} label="Dating" onPress={() => undefined} selected />
        <TagPill color="#C4A882" interactive={editMode} label="Workout" onPress={() => undefined} selected={false} />
        <TagPill color="#8BAA7A" interactive={editMode} label="Friends" onPress={() => undefined} selected />
      </View>
      <PhotoManager
        canEdit={editMode}
        isBusy={Boolean(photoOperation)}
        onDelete={() => undefined}
        onMakePrimary={() => undefined}
        onMoveLeft={() => undefined}
        onMoveRight={() => undefined}
        onUpload={() => undefined}
        operation={photoOperation}
        photos={profile.photos ?? []}
      />
    </View>
  );
}

const meta = {
  title: 'Profile/ProfileSections',
  component: ProfileSectionsStory,
  decorators: [withStorySurface({ centered: false })],
  args: {
    editMode: true,
    photoCount: 5,
    photoOperation: null,
  },
} satisfies Meta<typeof ProfileSectionsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editing: Story = {};

export const ReadOnly: Story = {
  args: {
    editMode: false,
  },
};

export const UploadingPhoto: Story = {
  args: {
    photoOperation: {
      type: 'upload',
      label: 'Uploading photo… 62%',
      progress: 62,
    },
  },
};

export const TwoPhotoGallery: Story = {
  args: {
    photoCount: 2,
  },
};

export const ReorderingPhoto: Story = {
  args: {
    photoOperation: {
      type: 'reorder',
      photoId: 'photo-2',
      label: 'Reordering photos…',
    },
  },
};

export const DeletingPhoto: Story = {
  args: {
    photoOperation: {
      type: 'delete',
      photoId: 'photo-1',
      label: 'Removing photo…',
    },
  },
};

export const BusyReadOnly: Story = {
  args: {
    editMode: false,
    photoOperation: {
      type: 'primary',
      photoId: 'photo-1',
      label: 'Setting primary photo…',
    },
  },
};
