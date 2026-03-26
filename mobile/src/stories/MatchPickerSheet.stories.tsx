import type { Meta, StoryObj } from '@storybook/react-native';
import { MatchPickerSheet } from '../features/chat/components/MatchPickerSheet';
import type { Match } from '../api/types';
import { queryKeys } from '../lib/query/queryKeys';
import { QuerySeededSheetStory, withStoryScreenFrame } from './support';

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

function MatchPickerSheetStory({ matches }: { matches: Match[] }) {
  return (
    <QuerySeededSheetStory
      buttonLabel="Open match picker"
      queryData={matches}
      queryKey={queryKeys.matches.list}
    >
      {({ close, controller }) => (
        <MatchPickerSheet
          controller={controller}
          onClose={close}
          onSelectMatch={() => undefined}
        />
      )}
    </QuerySeededSheetStory>
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
