import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { UserPhoto } from '../../../../api/types';
import { EditableField, PhotoManager } from '../ProfileSections';

jest.mock('../../../../components/ui/AppIcon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`app-icon-${name}`} />;
  },
}));

function makePhoto(overrides: Partial<UserPhoto>): UserPhoto {
  return {
    id: overrides.id ?? 'photo-1',
    storageKey: overrides.storageKey ?? 'https://images.example.com/one.jpg',
    isPrimary: overrides.isPrimary ?? false,
    isHidden: overrides.isHidden ?? false,
    sortOrder: overrides.sortOrder ?? 0,
  };
}

function renderPhotoManager(photos: UserPhoto[], overrides: Partial<React.ComponentProps<typeof PhotoManager>> = {}) {
  const props: React.ComponentProps<typeof PhotoManager> = {
    canEdit: true,
    isBusy: false,
    onDelete: jest.fn(),
    onMakePrimary: jest.fn(),
    onMoveLeft: jest.fn(),
    onMoveRight: jest.fn(),
    onUpload: jest.fn(),
    operation: null,
    photos,
    ...overrides,
  };

  return {
    props,
    ...render(<PhotoManager {...props} />),
  };
}

describe('ProfileSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty photo state and forwards the upload action', () => {
    const { props } = renderPhotoManager([]);

    expect(screen.getByText('No photos yet')).toBeTruthy();
    expect(screen.getByText('Add photo')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Add photo'));

    expect(props.onUpload).toHaveBeenCalledTimes(1);
  });

  it('renders ordered photo cards and promotes a secondary photo', () => {
    const photos = [
      makePhoto({
        id: 'photo-primary',
        isPrimary: true,
        sortOrder: 1,
        storageKey: 'https://images.example.com/primary.jpg',
      }),
      makePhoto({
        id: 'photo-secondary',
        sortOrder: 2,
        storageKey: 'https://images.example.com/secondary.jpg',
      }),
    ];
    const { props } = renderPhotoManager(photos);

    expect(screen.getByText('Primary photo')).toBeTruthy();
    expect(screen.getByText('Photo 2')).toBeTruthy();
    expect(screen.getAllByLabelText('Move photo earlier')[0].props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(screen.getByLabelText('Make primary photo')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Make primary photo'));

    expect(props.onMakePrimary).toHaveBeenCalledWith('photo-secondary');
  });

  it('renders editable fields as text inputs when edit mode is enabled', () => {
    const onChangeText = jest.fn();

    const { rerender } = render(
      <EditableField
        editMode={false}
        label="City"
        onChangeText={onChangeText}
        placeholder="Honolulu"
        value=""
      />,
    );

    expect(screen.getByText('Honolulu')).toBeTruthy();

    rerender(
      <EditableField
        editMode
        label="City"
        onChangeText={onChangeText}
        placeholder="Honolulu"
        value="Kailua"
      />,
    );

    expect(screen.getByDisplayValue('Kailua')).toBeTruthy();
  });

  it('shows inline operation state and disables actions while busy', () => {
    const photos = [
      makePhoto({
        id: 'photo-primary',
        isPrimary: true,
        sortOrder: 0,
      }),
      makePhoto({
        id: 'photo-secondary',
        sortOrder: 1,
      }),
    ];

    renderPhotoManager(photos, {
      isBusy: true,
      operation: {
        type: 'reorder',
        photoId: 'photo-secondary',
        label: 'Reordering photos…',
      },
    });

    expect(screen.getByText('Reordering photos…')).toBeTruthy();
    expect(screen.getAllByLabelText('Move photo later')[0].props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(screen.getByText('Working…')).toBeTruthy();
  });

  it('ignores hidden photos when ordering the gallery', () => {
    const photos = [
      makePhoto({
        id: 'photo-hidden',
        isHidden: true,
        sortOrder: 0,
      }),
      makePhoto({
        id: 'photo-primary',
        isPrimary: true,
        sortOrder: 1,
      }),
      makePhoto({
        id: 'photo-secondary',
        sortOrder: 2,
      }),
    ];

    renderPhotoManager(photos);

    expect(screen.queryByText('Photo 3')).toBeNull();
    expect(screen.getByText('Photo 2')).toBeTruthy();
  });

  it('hides photo controls when editing is disabled', () => {
    renderPhotoManager(
      [
        makePhoto({
          id: 'photo-primary',
          isPrimary: true,
          sortOrder: 0,
        }),
      ],
      {
        canEdit: false,
      },
    );

    expect(screen.queryByText('Add photo')).toBeNull();
    expect(screen.queryByLabelText('Remove photo')).toBeNull();
    expect(screen.queryByLabelText('Move photo later')).toBeNull();
  });
});
