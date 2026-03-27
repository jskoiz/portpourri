import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createScreenNavigation, createScreenRoute } from '../../lib/testing/screenProps';
import CreateScreen, { buildStartDate } from '../CreateScreen';
import {
  formatPlanDetailsSummary,
  getPlanDetailsActionLabel,
  getPlanDetailsHint,
  formatTimingSummary,
} from '../../features/events/create/create.helpers';
import { getFloatingTabBarReservedHeight } from '../../design/layout/tabBarLayout';
import { screenLayout } from '../../design/primitives';

const mockCreateEvent = jest.fn();
const mockReset = jest.fn();

jest.mock('../../features/events/hooks/useCreateEvent', () => ({
  useCreateEvent: () => ({
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
    createError: null,
    isCreating: false,
    reset: mockReset,
  }),
}));

jest.mock('../../features/locations/useKnownLocationSuggestions', () => ({
  useKnownLocationSuggestions: () => [],
}));

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});

jest.mock('../../components/form/LocationField', () => {
  const React = require('react');
  const { Pressable, Text, TextInput, View } = require('react-native');

  type MockLocationFieldProps = {
    onChangeText: (value: string) => void;
    placeholder: string;
    value?: string;
  };

  return {
    LocationField: ({ onChangeText, placeholder, value = '' }: MockLocationFieldProps) => {
      const [draft, setDraft] = React.useState(value);

      return (
        <View>
          <TextInput
            placeholder={placeholder}
            value={draft}
            onChangeText={(next: string) => {
              setDraft(next);
              onChangeText(next);
            }}
          />
          {draft ? (
            <Pressable accessibilityRole="button" onPress={() => onChangeText(draft)}>
              <Text>{`Use "${draft}"`}</Text>
            </Pressable>
          ) : null}
        </View>
      );
    },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('CreateScreen', () => {
  const navigation = createScreenNavigation();
  const route = createScreenRoute('Create');

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEvent.mockResolvedValue({
      id: 'event-1',
      title: 'Run at Magic Island',
      location: 'Magic Island',
      startsAt: '2026-03-15T16:00:00.000Z',
      host: { id: 'user-1', firstName: 'Jordan' },
      attendeesCount: 1,
      joined: true,
    });
  });

  it('keeps typed event details intact through the create flow', async () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    const noteInput = screen.getByPlaceholderText(
      'Easy pace, bring water, no experience needed...',
    );
    fireEvent.changeText(noteInput, 'Bring water and meet by the tennis courts.');

    expect(screen.getByDisplayValue('Bring water and meet by the tennis courts.')).toBeTruthy();
  });

  it('reserves space for the floating tab bar below the form', () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    const contentContainerStyle = screen.getByTestId('create-screen-scroll-view').props
      .contentContainerStyle;
    const scrollViewStyles = Array.isArray(contentContainerStyle)
      ? Object.assign({}, ...contentContainerStyle)
      : contentContainerStyle;

    expect(scrollViewStyles.paddingBottom - screenLayout.screenBottomPadding).toBe(
      getFloatingTabBarReservedHeight(0),
    );
  });

  it('shows an inline success card after posting an activity', async () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('Run'));
    fireEvent.press(screen.getByText('Tomorrow'));
    fireEvent.press(screen.getByText('Evening'));
    fireEvent.changeText(screen.getByPlaceholderText('Runyon Canyon, Venice Beach...'), 'Magic Island');
    fireEvent.press(screen.getByText('Use "Magic Island"'));
    fireEvent.press(screen.getByText('Post Run'));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Run',
          location: 'Magic Island',
          title: 'Run at Magic Island',
        }),
      );
    });

    expect(await screen.findByText('INVITE POSTED')).toBeTruthy();
    expect(screen.getByText('Run at Magic Island')).toBeTruthy();
    expect(screen.getByText('View event')).toBeTruthy();
    expect(screen.getByText('Share')).toBeTruthy();
    expect(screen.getByText('Create another')).toBeTruthy();

    fireEvent.press(screen.getByText('View event'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event-1' });
    });
  });
});

describe('buildStartDate', () => {
  function mockDateToDay(dayOfWeek: number, hour = 8) {
    // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
    const fakeNow = new Date(2024, 0, 1); // Jan 1 2024 = Monday
    // advance to the desired day of week
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    fakeNow.setDate(fakeNow.getDate() + mondayOffset);
    fakeNow.setHours(hour, 0, 0, 0);
    jest.useFakeTimers({ now: fakeNow });
    jest.setSystemTime(fakeNow);
    return fakeNow;
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a Saturday when "This Weekend" is selected on a Monday morning', () => {
    mockDateToDay(1, 8); // Monday 8am
    const result = buildStartDate('This Weekend', 'Morning');
    expect(result.getDay()).toBe(6); // Saturday
  });

  it('returns a Sunday (not next Saturday) when "This Weekend" is selected on a Sunday morning', () => {
    mockDateToDay(0, 8); // Sunday 8am
    const result = buildStartDate('This Weekend', 'Morning');
    // Should stay within the current weekend (Sunday), not jump 6 days to next Saturday
    expect(result.getDay()).toBe(0); // Sunday
  });

  it('returns tomorrow when "Tomorrow" is selected', () => {
    const now = mockDateToDay(1, 8); // Monday 8am
    const result = buildStartDate('Tomorrow', 'Morning');
    expect(result.getDate()).toBe(now.getDate() + 1);
  });

  it('returns next Monday when "Next Week" is selected midweek', () => {
    mockDateToDay(3, 8); // Wednesday 8am
    const result = buildStartDate('Next Week', 'Morning');
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(8); // Jan 8 2024
  });

  it('sets morning hours to 9am', () => {
    mockDateToDay(1, 8); // Monday 8am
    const result = buildStartDate('Tomorrow', 'Morning');
    expect(result.getHours()).toBe(9);
  });

  it('sets afternoon hours to 2pm', () => {
    mockDateToDay(1, 8); // Monday 8am
    const result = buildStartDate('Tomorrow', 'Afternoon');
    expect(result.getHours()).toBe(14);
  });

  it('sets evening hours to 6pm', () => {
    mockDateToDay(1, 8); // Monday 8am
    const result = buildStartDate('Tomorrow', 'Evening');
    expect(result.getHours()).toBe(18);
  });

  it('bumps to next day when resulting time is in the past', () => {
    mockDateToDay(1, 20); // Monday 8pm — "Morning" on "Today" would be 9am, already past
    const result = buildStartDate('Today', 'Morning');
    // 9am today has passed (it's 8pm), so it should advance to Tuesday
    expect(result.getDay()).toBe(2); // Tuesday
    expect(result.getHours()).toBe(9);
  });
});

describe('create timing summary copy', () => {
  it('shows the missing day when only a time window is selected', () => {
    expect(formatTimingSummary('', 'Afternoon')).toBe('Choose day / Afternoon');
    expect(formatPlanDetailsSummary('', 'Afternoon', '')).toBe('Choose day / Afternoon');
    expect(getPlanDetailsActionLabel('', 'Afternoon')).toBe('Choose day');
    expect(getPlanDetailsHint('', 'Afternoon')).toBe('Pick a day to finish the timing.');
  });

  it('shows the missing time window when only a day is selected', () => {
    expect(formatTimingSummary('Tomorrow', '')).toBe('Tomorrow / Choose time');
    expect(formatPlanDetailsSummary('Tomorrow', '', 'Intermediate')).toBe(
      'Tomorrow / Choose time · Intermediate',
    );
    expect(getPlanDetailsActionLabel('Tomorrow', '')).toBe('Choose time');
    expect(getPlanDetailsHint('Tomorrow', '')).toBe('Pick a time window to finish the timing.');
  });

  it('uses a generic setup prompt before anything is selected', () => {
    expect(getPlanDetailsActionLabel('', '')).toBe('Choose day and time');
    expect(getPlanDetailsHint('', '')).toBe('Choose both a day and a time window before posting.');
  });

  it('falls back to edit copy once timing is complete', () => {
    expect(getPlanDetailsActionLabel('Tomorrow', 'Afternoon')).toBe('Edit plan details');
    expect(getPlanDetailsHint('Tomorrow', 'Afternoon')).toBeNull();
  });
});
