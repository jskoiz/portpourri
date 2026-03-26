import type { Meta, StoryObj } from '@storybook/react-native';
import { SuggestPlanSheet } from '../features/chat/components/SuggestPlanSheet';
import type { EventSummary } from '../api/types';
import { queryKeys } from '../lib/query/queryKeys';
import { makeEventSummary, QuerySeededSheetStory, withStoryScreenFrame } from './support';

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

function SuggestPlanSheetStory({ events }: { events: EventSummary[] }) {
  return (
    <QuerySeededSheetStory
      buttonLabel="Open plan picker"
      queryData={events}
      queryKey={queryKeys.events.mine}
    >
      {({ close, controller }) => (
        <SuggestPlanSheet
          controller={controller}
          onClose={close}
          onCreateEvent={() => undefined}
          onSelectEvent={() => undefined}
        />
      )}
    </QuerySeededSheetStory>
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
