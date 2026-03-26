import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../NotificationsScreen';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockUseNotifications = jest.fn();
const mockRefetch = jest.fn();
const baseNotificationState = {
  error: null,
  isLoading: false,
  isRefetching: false,
  markAllRead: mockMarkAllRead,
  markRead: mockMarkRead,
  refetch: mockRefetch,
  unreadCount: 1,
};

const createNotificationsState = (overrides: Record<string, unknown> = {}) => ({
  ...baseNotificationState,
  ...overrides,
});

const mockNavigation = { goBack: mockGoBack, navigate: mockNavigate } as any;

function renderScreen() {
  return render(
    <NotificationsScreen
      navigation={mockNavigation}
      route={{ key: 'Notifications-1', name: 'Notifications' } as any}
    />,
  );
}

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'match_created',
    title: 'New message',
    body: 'Meet me for coffee after?',
    readAt: null,
    createdAt: new Date().toISOString(),
    data: { matchId: 'match-1', withUserId: 'user-2' },
    ...overrides,
  };
}

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

jest.mock('../../features/notifications/hooks/useNotifications', () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
}));

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});

describe('NotificationsScreen', () => {
  const malformedNotificationCases: Array<
    [
      string,
      {
        type:
          | 'match_created'
          | 'message_received'
          | 'event_rsvp'
          | 'event_invite'
          | 'event_reminder'
          | 'like_received';
        title: string;
        body: string;
        data: Record<string, unknown>;
      },
      string,
    ]
  > = [
    [
      'match notifications',
      {
        type: 'match_created',
        title: 'Could not route match',
        body: 'Missing a match id',
        data: { withUserId: 'user-2' },
      },
      'Match notification is missing navigation details.',
    ],
    [
      'message notifications',
      {
        type: 'message_received',
        title: 'Could not route message',
        body: 'Missing a match id',
        data: { senderId: 'user-3' },
      },
      'Message notification is missing navigation details.',
    ],
    [
      'event RSVP notifications',
      {
        type: 'event_rsvp',
        title: 'Could not route RSVP',
        body: 'Missing an event id',
        data: { attendeeId: 'user-4' },
      },
      'Event notification is missing navigation details.',
    ],
    [
      'event invite notifications',
      {
        type: 'event_invite',
        title: 'Could not route invite',
        body: 'Missing a match id',
        data: { eventId: 'event-7' },
      },
      'Event invite notification is missing navigation details.',
    ],
    [
      'event reminder notifications',
      {
        type: 'event_reminder',
        title: 'Could not route reminder',
        body: 'Missing an event id',
        data: {},
      },
      'Event notification is missing navigation details.',
    ],
    [
      'like notifications',
      {
        type: 'like_received',
        title: 'Could not route like',
        body: 'Missing a user id',
        data: {},
      },
      'Like notification is missing navigation details.',
    ],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue(
      createNotificationsState({
        notifications: [makeNotification()],
      }),
    );
    mockMarkRead.mockResolvedValue(undefined);
    mockMarkAllRead.mockResolvedValue(undefined);
    mockRefetch.mockResolvedValue(undefined);
  });

  it('loads notifications and marks an item as read', async () => {
    renderScreen();

    const row = await screen.findByText('New message');
    const accessibleRow = screen.UNSAFE_getByProps({
      accessibilityLabel: 'New message. Meet me for coffee after?',
    });
    expect(accessibleRow.props.accessibilityHint).toBe('Opens the notification and marks it as read');
    expect(accessibleRow.props.accessibilityValue).toEqual({ text: 'Unread' });
    fireEvent.press(row);

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('announces loading and empty states', () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [],
      isLoading: true,
      unreadCount: 0,
    });

    render(<NotificationsScreen navigation={mockNavigation} route={{ key: 'Notifications-1', name: 'Notifications' } as any} />);

    expect(screen.getByLabelText('Loading: Loading notifications')).toBeTruthy();
  });

  it('renders the empty state when there are no notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [],
      unreadCount: 0,
    });

    render(<NotificationsScreen navigation={mockNavigation} route={{ key: 'Notifications-1', name: 'Notifications' } as any} />);

    expect(screen.getByText('No notifications')).toBeTruthy();
    expect(screen.getByText("You'll see matches, messages, and event updates here.")).toBeTruthy();
  });

  it('navigates match notifications to chat', async () => {
    renderScreen();

    const title = screen.getByText('New message');
    fireEvent.press(title);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-1',
        user: { id: 'user-2', firstName: 'Match' },
      });
    });
  });

  it('navigates message notifications to chat', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          type: 'message_received',
          data: { matchId: 'match-2', senderId: 'user-3' },
        }),
      ],
    });

    renderScreen();

    const title = screen.getByText('New message');
    fireEvent.press(title);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-2',
        user: { id: 'user-3', firstName: 'Message' },
      });
    });
  });

  it('navigates event notifications to event detail', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          type: 'event_rsvp',
          title: 'Event RSVP',
          body: 'Someone joined',
          data: { eventId: 'event-1', attendeeId: 'user-4' },
        }),
      ],
    });

    renderScreen();

    const title = screen.getByText('Event RSVP');
    fireEvent.press(title);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event-1' });
    });
  });

  it('navigates event reminder notifications to event detail', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          type: 'event_reminder',
          title: 'Event reminder',
          body: 'Your event starts soon',
          data: { eventId: 'event-2' },
        }),
      ],
    });

    renderScreen();

    fireEvent.press(await screen.findByText('Event reminder'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event-2' });
    });
  });

  it('navigates event invite notifications to chat', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          type: 'event_invite',
          title: 'Event invite',
          body: 'Someone invited you out',
          data: { eventId: 'event-3', matchId: 'match-9', withUserId: 'user-8' },
        }),
      ],
    });

    renderScreen();

    fireEvent.press(await screen.findByText('Event invite'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-9',
        user: { id: 'user-8', firstName: 'Event' },
      });
    });
  });

  it('announces already-read notification rows differently', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'match_created',
          title: 'Already read',
          body: 'You matched earlier',
          readAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          data: { matchId: 'match-3', withUserId: 'user-4' },
        },
      ],
      unreadCount: 0,
    });

    render(<NotificationsScreen navigation={mockNavigation} route={{ key: 'Notifications-1', name: 'Notifications' } as any} />);

    const accessibleRow = screen.UNSAFE_getByProps({
      accessibilityLabel: 'Already read. You matched earlier',
    });
    expect(accessibleRow.props.accessibilityHint).toBe('Opens the notification');
    expect(accessibleRow.props.accessibilityValue).toEqual({ text: 'Read' });
  });

  it('navigates like notifications to profile detail', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          type: 'like_received',
          title: 'Someone likes you',
          body: 'You received a like',
          data: { fromUserId: 'user-5' },
        }),
      ],
    });

    renderScreen();

    const title = screen.getByText('Someone likes you');
    fireEvent.press(title);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('ProfileDetail', {
        user: { id: 'user-5', firstName: 'Profile' },
        userId: 'user-5',
      });
    });
  });

  it.each(malformedNotificationCases)(
    'shows an error when %s are missing navigation data',
    async (_label, notification, errorMessage) => {
      mockUseNotifications.mockReturnValue({
        ...baseNotificationState,
        notifications: [makeNotification(notification)],
      });

      renderScreen();

      fireEvent.press(await screen.findByText(notification.title));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    },
  );

  it('does not mark read again when opening an already-read notification', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          readAt: '2026-01-01T00:00:00Z',
        }),
      ],
    });

    renderScreen();

    fireEvent.press(await screen.findByText('New message'));

    await waitFor(() => {
      expect(mockMarkRead).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        matchId: 'match-1',
        user: { id: 'user-2', firstName: 'Match' },
      });
    });
  });

  it('groups notifications into Today, Yesterday, and Earlier sections', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const earlier = new Date();
    earlier.setDate(earlier.getDate() - 3);

    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          id: 'notif-today',
          title: 'Today match',
          createdAt: new Date().toISOString(),
        }),
        makeNotification({
          id: 'notif-yesterday',
          title: 'Yesterday match',
          createdAt: yesterday.toISOString(),
        }),
        makeNotification({
          id: 'notif-earlier',
          title: 'Earlier match',
          createdAt: earlier.toISOString(),
        }),
      ],
    });

    renderScreen();

    expect(await screen.findByText('Today')).toBeTruthy();
    expect(screen.getByText('Today match')).toBeTruthy();
    expect(screen.getByText('Yesterday')).toBeTruthy();
    expect(screen.getByText('Yesterday match')).toBeTruthy();
    expect(screen.getByText('Earlier')).toBeTruthy();
    expect(screen.getByText('Earlier match')).toBeTruthy();
  });

  it('groups yesterday notifications under a Yesterday header', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          id: 'notif-yesterday',
          title: 'Yesterday match',
          body: 'You matched yesterday',
          createdAt: yesterday.toISOString(),
          data: { matchId: 'match-y', withUserId: 'user-y' },
        }),
      ],
    });

    renderScreen();

    expect(await screen.findByText('Yesterday')).toBeTruthy();
    expect(screen.getByText('Yesterday match')).toBeTruthy();
  });

  it('shows an error for unsupported notification types', async () => {
    mockUseNotifications.mockReturnValue({
      ...baseNotificationState,
      notifications: [
        makeNotification({
          type: 'system',
          title: 'System update',
          body: 'No direct navigation',
          data: { noticeId: 'system-1' },
        }),
      ],
    });

    renderScreen();

    fireEvent.press(await screen.findByText('System update'));

    await waitFor(() => {
      expect(screen.getByText('This notification does not support direct navigation.')).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('clears all notifications and resets the unread badge count', async () => {
    renderScreen();

    const clearAll = await screen.findByText('Clear all');
    fireEvent.press(clearAll);

    await waitFor(() => {
      expect(mockMarkAllRead).toHaveBeenCalled();
    });
  });
});
