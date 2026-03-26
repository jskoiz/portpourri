import type { Meta, StoryObj } from '@storybook/react-native';
import { CreatePlanSummaryCard } from '../features/events/create/CreatePlanSummaryCard';
import { withStorySurface } from './support';

const meta = {
  title: 'Events/CreatePlanSummaryCard',
  component: CreatePlanSummaryCard,
  decorators: [withStorySurface({ centered: false })],
} satisfies Meta<typeof CreatePlanSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyToPost: Story = {
  args: {
    selectedActivity: 'Run',
    selectedColor: '#8BAA7A',
    selectedTime: 'Evening',
    selectedWhen: 'Tomorrow',
    where: 'Magic Island',
  },
};
