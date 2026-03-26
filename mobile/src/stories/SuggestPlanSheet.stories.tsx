import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '../design/primitives';
import { useSheetController } from '../design/sheets/useSheetController';
import { SuggestPlanSheet } from '../features/chat/components/SuggestPlanSheet';
import type { EventSummary } from '../api/types';
import { queryKeys } from '../lib/query/queryKeys';
import { makeEventSummary, withStoryScreenFrame } from './support';

function toIsoFromNow(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

const seededEvents: EventSummary[] = [
  makeEventSummary({
    id: 'event-future-1',
    title: 'Sunrise yoga',
    location: 'Magic Island',
    startsAt: toIsoFromNow(7),
    endsAt: toIsoFromNow(7),
  }),
  makeEventSummary({
    id: 'event-past-1',
    title: 'Trail brunch',
    location: 'Makai Market',
    startsAt: toIsoFromNow(-7),
    endsAt: toIsoFromNow(-7),
  }),
  makeEventSummary({
    id: 'event-future-2',
    title: 'Climb session',
    location: 'Honolulu Boulder',
    startsAt: toIsoFromNow(14),
    endsAt: toIsoFromNow(14),
  }),
];

function createQueryClient(events: EventSummary[]) {
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

  client.setQueryData(queryKeys.events.mine, events);
  return client;
}

function SuggestPlanSheetStory({ events }: { events: EventSummary[] }) {
  const sheet = useSheetController();
  const queryClient = React.useMemo(() => createQueryClient(events), [events]);

  React.useEffect(() => {
    sheet.open();
  }, [sheet.open]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
        <Button label="Open plan picker" onPress={sheet.open} variant="secondary" />
        <SuggestPlanSheet
          controller={sheet.sheetProps}
          onClose={sheet.close}
          onCreateEvent={() => undefined}
          onSelectEvent={() => undefined}
        />
      </View>
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Chat/SuggestPlanSheet',
  component: SuggestPlanSheetStory,
  decorators: [withStoryScreenFrame({ height: 860 })],
  args: {
    events: seededEvents,
  },
} satisfies Meta<typeof SuggestPlanSheetStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CreateOnly: Story = {
  args: {
    events: [
      makeEventSummary({
        id: 'event-past-2',
        title: 'Recovery walk',
        location: 'Kakaako',
        startsAt: toIsoFromNow(-10),
        endsAt: toIsoFromNow(-10),
      }),
    ],
  },
};
