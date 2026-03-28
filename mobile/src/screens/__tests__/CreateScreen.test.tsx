import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createScreenNavigation, createScreenRoute } from '../../lib/testing/screenProps';
import CreateScreen from '../CreateScreen';

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

jest.mock('../../features/events/hooks/useInviteToEvent', () => ({
  useInviteToEvent: () => ({
    invite: jest.fn().mockResolvedValue({}),
    isInviting: false,
  }),
}));

jest.mock('../../features/locations/useKnownLocationSuggestions', () => ({
  useKnownLocationSuggestions: () => [],
}));

jest.mock('../../features/matches/hooks/useMatches', () => ({
  useMatches: () => ({
    matches: [],
    isLoading: false,
  }),
}));

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});

jest.mock('../../components/ui/AppBackButton', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress}>
      <Text>Back</Text>
    </Pressable>
  );
});

jest.mock('../../components/ui/AppBackdrop', () => {
  const React = require('react');
  const { View } = require('react-native');

  return () => <View />;
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

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: () => <View testID="datetime-picker" />,
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

  it('renders the first step with activity picker', () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    expect(screen.getByText('What are you doing?')).toBeTruthy();
    expect(screen.getByText('Run')).toBeTruthy();
    expect(screen.getByText('Yoga')).toBeTruthy();
  });

  it('advances to step 2 after selecting an activity', () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('Run'));
    fireEvent.press(screen.getByText('Next'));

    expect(screen.getByText('When and where?')).toBeTruthy();
  });

  it('shows success card after completing the flow and posting', async () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    // Step 1: Select activity
    fireEvent.press(screen.getByText('Run'));
    fireEvent.press(screen.getByText('Next'));

    // Step 2: Location (date/time are pre-filled)
    fireEvent.changeText(screen.getByPlaceholderText('Where are you meeting?'), 'Magic Island');
    fireEvent.press(screen.getByText('Use "Magic Island"'));
    fireEvent.press(screen.getByText('Next'));

    // Step 3: Details — advance to invite step
    fireEvent.press(screen.getAllByText('Next')[0]);

    // Step 4: Invite — post without invites
    fireEvent.press(screen.getByText('Post without invites'));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'RUNNING',
          location: 'Magic Island',
          title: 'Run at Magic Island',
        }),
      );
    });

    expect(await screen.findByText('INVITE POSTED')).toBeTruthy();
    expect(screen.getByText('Run at Magic Island')).toBeTruthy();

    fireEvent.press(screen.getByText('View event'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event-1' });
    });
  });

  it('sends the correct category enum value', async () => {
    render(<CreateScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('Yoga'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.changeText(screen.getByPlaceholderText('Where are you meeting?'), 'Beach Park');
    fireEvent.press(screen.getByText('Use "Beach Park"'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.press(screen.getAllByText('Next')[0]);
    fireEvent.press(screen.getByText('Post without invites'));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'YOGA',
        }),
      );
    });
  });
});
