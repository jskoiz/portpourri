import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import { AppBottomSheet } from '../AppBottomSheet';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    BottomSheetModal: React.forwardRef(
      (
        {
          backdropComponent,
          children,
          ...props
        }: {
          backdropComponent?: React.ReactNode | ((args: unknown) => React.ReactNode);
          children: React.ReactNode;
          onChange?: (index: number) => void;
          onDismiss?: () => void;
          snapPoints: ReadonlyArray<string | number>;
        },
        ref: React.Ref<{ present: () => void; dismiss: () => void }>,
      ) => {
        React.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }), []);

        return (
          <View testID="bottom-sheet-modal">
            <Text testID="snap-points">{JSON.stringify(props.snapPoints)}</Text>
            {typeof backdropComponent === 'function' ? backdropComponent({}) : backdropComponent}
            {children}
          </View>
        );
      },
    ),
    BottomSheetBackdrop: ({ onPress }: { onPress?: () => void }) => (
      <Pressable testID="bottom-sheet-backdrop" onPress={onPress} />
    ),
    BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('../../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    border: '#E8E2DA',
    borderSoft: '#F0EBE4',
    surface: '#FFFFFF',
    textPrimary: '#2C2420',
    textMuted: '#7A7068',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../components/ui/AppIcon', () => {
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

jest.mock('../../primitives/GlassView', () => ({
  GlassView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppBottomSheet', () => {
  const refObject = { current: { present: mockPresent, dismiss: mockDismiss } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('presents and dismisses the modal when visibility changes', () => {
    const { rerender } = render(
      <AppBottomSheet
        onDismiss={jest.fn()}
        refObject={refObject as never}
        title="Quick actions"
        visible
      >
        <View />
      </AppBottomSheet>,
    );

    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(mockDismiss).not.toHaveBeenCalled();

    rerender(
      <AppBottomSheet
        onDismiss={jest.fn()}
        refObject={refObject as never}
        title="Quick actions"
        visible={false}
      >
        <View />
      </AppBottomSheet>,
    );

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses the request-close handler for the close button and backdrop', () => {
    const onDismiss = jest.fn();
    const onRequestClose = jest.fn();

    const { getByLabelText, getByTestId } = render(
      <AppBottomSheet
        onDismiss={onDismiss}
        onRequestClose={onRequestClose}
        refObject={refObject as never}
        title="Quick actions"
        visible
      >
        <View />
      </AppBottomSheet>,
    );

    fireEvent.press(getByLabelText('Close Quick actions'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('bottom-sheet-backdrop'));
    expect(onRequestClose).toHaveBeenCalledTimes(2);
  });
});
