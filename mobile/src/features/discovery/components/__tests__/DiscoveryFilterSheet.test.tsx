import React from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DiscoveryFilterSheet } from '../DiscoveryFilterSheet';
import type { FilterModalState } from '../discoveryFilters';
import { lightTheme } from '../../../../theme/tokens';

const mockLightTheme = lightTheme;

const mockAppBottomSheet = jest.fn(({ children, subtitle, title, ...props }: any) => {
  const { Text, View } = require('react-native');

  return (
    <View testID="discovery-filter-sheet">
      <Text>{title}</Text>
      {subtitle ? <Text>{subtitle}</Text> : null}
      <Text testID="bottom-sheet-visible">{String(props.visible)}</Text>
      {children}
    </View>
  );
});

jest.mock('../../../../design/sheets/AppBottomSheet', () => ({
  __esModule: true,
  APP_BOTTOM_SHEET_SNAP_POINTS: {
    compact: ['50%'],
    standard: ['62%'],
    form: ['72%'],
    tall: ['82%'],
  },
  AppBottomSheet: (props: Record<string, unknown>) => mockAppBottomSheet(props),
}));

jest.mock('../../../../theme/useTheme', () => ({
  useTheme: () => mockLightTheme,
}));

const baseState: FilterModalState = {
  availability: ['morning'],
  distanceKm: '25',
  goals: ['strength'],
  intensity: ['moderate'],
  maxAge: '40',
  minAge: '22',
};

function renderSheet(overrides: Partial<React.ComponentProps<typeof DiscoveryFilterSheet>> = {}) {
  const controller = {
    onChangeIndex: jest.fn(),
    onDismiss: jest.fn(),
    onRequestClose: jest.fn(),
    refObject: React.createRef<BottomSheetModal | null>(),
    visible: true,
  } as const;

  const onApply = jest.fn();
  const onChangeAvailability = jest.fn();
  const onChangeDistanceKm = jest.fn();
  const onChangeGoals = jest.fn();
  const onChangeIntensity = jest.fn();
  const onChangeMaxAge = jest.fn();
  const onChangeMinAge = jest.fn();
  const onUndoSwipe = jest.fn();

  render(
    <DiscoveryFilterSheet
      controller={controller}
      onApply={onApply}
      onChangeAvailability={onChangeAvailability}
      onChangeDistanceKm={onChangeDistanceKm}
      onChangeGoals={onChangeGoals}
      onChangeIntensity={onChangeIntensity}
      onChangeMaxAge={onChangeMaxAge}
      onChangeMinAge={onChangeMinAge}
      onUndoSwipe={onUndoSwipe}
      state={baseState}
      {...overrides}
    />,
  );

  return {
    controller,
    onApply,
    onChangeAvailability,
    onChangeDistanceKm,
    onChangeGoals,
    onChangeIntensity,
    onChangeMaxAge,
    onChangeMinAge,
    onUndoSwipe,
  };
}

describe('DiscoveryFilterSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wires the visible sheet, filter pills, steppers, and actions', () => {
    const {
      controller,
      onApply,
      onChangeAvailability,
      onChangeDistanceKm,
      onChangeGoals,
      onChangeIntensity,
      onChangeMaxAge,
      onChangeMinAge,
      onUndoSwipe,
    } = renderSheet();

    expect(mockAppBottomSheet.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        title: 'Filters',
        subtitle: 'Adjust who you see.',
        visible: true,
        refObject: controller.refObject,
      }),
    );

    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.getByText('Adjust who you see.')).toBeTruthy();
    expect(screen.getByLabelText('strength').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByLabelText('morning').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByLabelText('evening').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );

    fireEvent.press(screen.getByLabelText('Increase Distance'));
    fireEvent.press(screen.getByLabelText('Decrease Min age'));
    fireEvent.press(screen.getByLabelText('Increase Max age'));
    fireEvent.press(screen.getByLabelText('endurance'));
    fireEvent.press(screen.getByLabelText('high'));
    fireEvent.press(screen.getByLabelText('evening'));
    fireEvent.press(screen.getByLabelText('Undo swipe'));
    fireEvent.press(screen.getByLabelText('Apply'));

    expect(onChangeDistanceKm).toHaveBeenCalledWith('26');
    expect(onChangeMinAge).toHaveBeenCalledWith('21');
    expect(onChangeMaxAge).toHaveBeenCalledWith('41');
    expect(onChangeGoals).toHaveBeenCalledWith('endurance');
    expect(onChangeIntensity).toHaveBeenCalledWith('high');
    expect(onChangeAvailability).toHaveBeenCalledWith('evening');
    expect(onUndoSwipe).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
