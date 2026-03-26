import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '../design/primitives';
import { useSheetController } from '../design/sheets/useSheetController';
import { MatchPickerSheet } from '../features/chat/components/MatchPickerSheet';
import type { Match } from '../api/types';
import { queryKeys } from '../lib/query/queryKeys';
import { withStoryScreenFrame } from './support';

const seededMatches: Match[] = [
  {
    id: 'match-1',
    createdAt: '2026-03-20T08:00:00.000Z',
    user: {
      id: 'user-1',
      firstName: 'Lana',
      photoUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
    lastMessage: 'Want to train tomorrow morning?',
  },
  {
    id: 'match-2',
    createdAt: '2026-03-21T08:00:00.000Z',
    user: {
      id: 'user-2',
      firstName: 'Noah',
      photoUrl: null,
    },
    lastMessage: null,
  },
];

function createQueryClient(matches: Match[]) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
    },
  });

  client.setQueryData(queryKeys.matches.list, matches);
  return client;
}

function MatchPickerSheetStory({ matches }: { matches: Match[] }) {
  const sheet = useSheetController();
  const queryClient = React.useMemo(() => createQueryClient(matches), [matches]);

  React.useEffect(() => {
    sheet.open();
  }, [sheet.open]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
        <Button label="Open match picker" onPress={sheet.open} variant="secondary" />
        <MatchPickerSheet
          controller={sheet.sheetProps}
          onClose={sheet.close}
          onSelectMatch={() => undefined}
        />
      </View>
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Chat/MatchPickerSheet',
  component: MatchPickerSheetStory,
  decorators: [withStoryScreenFrame({ height: 820 })],
  args: {
    matches: seededMatches,
  },
} satisfies Meta<typeof MatchPickerSheetStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  args: {
    matches: [],
  },
};
