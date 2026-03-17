import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../NotificationsScreen';

const mockGoBack = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockUseNotifications = jest.fn();

const mockNavigation = { goBack: mockGoBack, navigate: jest.fn() } as any;

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

jest.mock('../../features/notifications/hooks/useNotifications', () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
}));

jest.mock('../../components/ui/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return () => <Text>icon</Text>;
});

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue({
      error: null,
      isLoading: false,
      isRefetching: false,
      markAllRead: mockMarkAllRead,
      markRead: mockMarkRead,
      notifications: [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'message_received',
          title: 'New message',
          body: 'Meet me for coffee after?',
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
      refetch: jest.fn(),
      unreadCount: 1,
    });
    mockMarkRead.mockResolvedValue(undefined);
    mockMarkAllRead.mockResolvedValue(undefined);
  });

  it('loads notifications and marks an item as read', async () => {
    render(<NotificationsScreen navigation={mockNavigation} route={{ key: 'Notifications-1', name: 'Notifications' } as any} />);

    const title = await screen.findByText('New message');
    fireEvent.press(title);

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('clears all notifications and resets the unread badge count', async () => {
    render(<NotificationsScreen navigation={mockNavigation} route={{ key: 'Notifications-1', name: 'Notifications' } as any} />);

    const clearAll = await screen.findByText('Clear all');
    fireEvent.press(clearAll);

    await waitFor(() => {
      expect(mockMarkAllRead).toHaveBeenCalled();
    });
  });
});
