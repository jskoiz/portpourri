import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MyEventsScreen from '../MyEventsScreen';

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseMyEvents = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

jest.mock('../../features/events/hooks/useMyEvents', () => ({
  useMyEvents: (...args: unknown[]) => mockUseMyEvents(...args),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('../../components/ui/AppBackdrop', () => () => null);
jest.mock('../../components/ui/AppBackButton', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return ({ onPress }: { onPress: () => void }) => (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress}>
      <Text>Back</Text>
    </Pressable>
  );
});
jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return ({ name }: { name: string }) => <Text>{name}</Text>;
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    primary: '#C4A882',
    accent: '#C4A882',
    surface: '#FFFFFF',
    background: '#FDFBF8',
    textPrimary: '#2C2420',
    textSecondary: '#7A7068',
    textMuted: '#B0A89E',
    border: '#E8E2DA',
    borderSoft: '#F0EBE4',
    primarySubtle: '#F7F4F0',
    surfaceElevated: '#F7F4F0',
    danger: '#C0392B',
    white: '#FFFFFF',
  }),
}));

describe('MyEventsScreen', () => {
  const navigation = {
    canGoBack: jest.fn(() => false),
    navigate: mockNavigate,
    goBack: jest.fn(),
  } as any;
  const route = {
    key: 'MyEvents-1',
    name: 'MyEvents',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
    mockUseMyEvents.mockReturnValue({
      error: null,
      events: [],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  it('announces loading and empty states for the active tab', () => {
    mockUseMyEvents.mockReturnValue({
      error: null,
      events: [],
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<MyEventsScreen navigation={navigation} route={route} />);

    expect(screen.getByLabelText('Loading: Loading your events')).toBeTruthy();
  });

  it('marks the active tab and exposes the empty-state cta', async () => {
    render(<MyEventsScreen navigation={navigation} route={route} />);

    expect(screen.getByLabelText('Joined events, 0 items').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );

    fireEvent.press(screen.getByLabelText('Created events, 0 items'));

    expect(await screen.findByText("You haven't hosted anything yet")).toBeTruthy();
    expect(screen.getByLabelText('Create Activity')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Create Activity'));

    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'Create' });
  });

  it('renders an error panel and retries the query', async () => {
    mockUseMyEvents.mockReturnValue({
      error: new Error('Events offline'),
      events: [],
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<MyEventsScreen navigation={navigation} route={route} />);

    expect(await screen.findByText("Couldn't load events")).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
