import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import EventDetailScreen from '../EventDetailScreen';

const mockGoBack = jest.fn();
const mockRefetch = jest.fn();
const mockJoinEvent = jest.fn();
const mockUseEventDetail = jest.fn();
const mockHapticSuccess = jest.fn().mockResolvedValue(undefined);

const mockEvent = {
  id: 'event-1',
  title: 'Makapuu sunrise hike',
  description: 'Early pace, scenic payoff, and coffee after.',
  location: 'Makapuu Lighthouse Trail',
  imageUrl: null,
  category: 'Hiking',
  startsAt: '2026-03-20T16:00:00.000Z',
  endsAt: '2026-03-20T18:00:00.000Z',
  host: { id: 'host-1', firstName: 'Nia' },
  attendeesCount: 6,
  joined: false,
};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('expo-image', () => ({
  Image: ({ accessibilityLabel }: { accessibilityLabel?: string }) => {
    const { View } = require('react-native');
    return <View accessibilityLabel={accessibilityLabel} />;
  },
}));

jest.mock('../../components/ui/AppBackButton', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress}>
      <Text>Back</Text>
    </Pressable>
  );
});

jest.mock('../../components/ui/AppBackdrop', () => () => null);

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

jest.mock('../../design/primitives', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    Button: ({
      label,
      onPress,
      disabled,
    }: {
      label: string;
      onPress: () => void;
      disabled?: boolean;
    }) => (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
    StatePanel: ({
      actionLabel,
      description,
      loading,
      onAction,
      title,
    }: {
      actionLabel?: string;
      description?: string;
      loading?: boolean;
      onAction?: () => void;
      title: string;
    }) => (
      <View>
        <Text>{title}</Text>
        {description ? <Text>{description}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
        {loading ? <Text>loading</Text> : null}
      </View>
    ),
  };
});

jest.mock('../../features/events/hooks/useEventDetail', () => ({
  useEventDetail: (...args: unknown[]) => mockUseEventDetail(...args),
}));

jest.mock('../../lib/interaction/feedback', () => ({
  hapticSuccess: (...args: unknown[]) => mockHapticSuccess(...args),
}));

describe('EventDetailScreen', () => {
  const navigation = {
    goBack: mockGoBack,
  } as any;
  const route = {
    key: 'EventDetail-1',
    name: 'EventDetail' as const,
    params: { eventId: 'event-1' },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEventDetail.mockReturnValue({
      error: null,
      event: mockEvent,
      isJoining: false,
      isLoading: false,
      joinEvent: mockJoinEvent,
      refetch: mockRefetch,
    });
    mockJoinEvent.mockResolvedValue({ status: 'joined', attendeesCount: 7 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading and error states from the event hook', async () => {
    mockUseEventDetail.mockReturnValueOnce({
      error: null,
      event: null,
      isJoining: false,
      isLoading: true,
      joinEvent: mockJoinEvent,
      refetch: mockRefetch,
    });

    const { rerender } = render(<EventDetailScreen navigation={navigation} route={route} />);

    expect(await screen.findByText('Loading event')).toBeTruthy();

    mockUseEventDetail.mockReturnValueOnce({
      error: new Error('The event could not be loaded.'),
      event: null,
      isJoining: false,
      isLoading: false,
      joinEvent: mockJoinEvent,
      refetch: mockRefetch,
    });

    rerender(<EventDetailScreen navigation={navigation} route={route} />);

    expect(await screen.findByText("Couldn't load event")).toBeTruthy();
    expect(screen.getByText('The event could not be loaded.')).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('joins an event and triggers haptic feedback on success', async () => {
    render(<EventDetailScreen navigation={navigation} route={route} />);

    fireEvent.press(await screen.findByLabelText('Join event'));

    await waitFor(() => {
      expect(mockJoinEvent).toHaveBeenCalledTimes(1);
      expect(mockHapticSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('surfaces a friendly network alert when joining fails', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockJoinEvent.mockRejectedValueOnce(
      Object.assign(new Error('Network Error'), { isAxiosError: true }),
    );

    render(<EventDetailScreen navigation={navigation} route={route} />);

    fireEvent.press(await screen.findByLabelText('Join event'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Could not join event',
        'A network error occurred. Please check your connection and try again.',
      );
    });
  });

  it('does not attempt a duplicate join when the event is already joined', () => {
    mockUseEventDetail.mockReturnValueOnce({
      error: null,
      event: { ...mockEvent, joined: true },
      isJoining: false,
      isLoading: false,
      joinEvent: mockJoinEvent,
      refetch: mockRefetch,
    });

    render(<EventDetailScreen navigation={navigation} route={route} />);

    expect(screen.getByText("You're going")).toBeTruthy();
    expect(mockJoinEvent).not.toHaveBeenCalled();
  });
});
