import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../NotificationsScreen';

const mockGoBack = jest.fn();
const mockList = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

jest.mock('../../services/api', () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockList(...args),
    markRead: (...args: unknown[]) => mockMarkRead(...args),
    markAllRead: (...args: unknown[]) => mockMarkAllRead(...args),
  },
}));

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      data: [
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
    });
    mockMarkRead.mockResolvedValue({
      data: {
        id: 'notif-1',
        userId: 'user-1',
        type: 'message_received',
        title: 'New message',
        body: 'Meet me for coffee after?',
        readAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
    mockMarkAllRead.mockResolvedValue({ data: { updated: 1 } });
  });

  it('loads notifications and marks an item as read', async () => {
    render(<NotificationsScreen />);

    const title = await screen.findByText('New message');
    fireEvent.press(title);

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
    });
  });
});
