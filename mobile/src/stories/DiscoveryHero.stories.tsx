import type { Meta, StoryObj } from '@storybook/react-native';
import { HomeHero } from '../features/discovery/components/HomeHero';
import { withStorySurface } from './support';

const meta = {
  title: 'Discovery/HomeHero',
  component: HomeHero,
  decorators: [withStorySurface({ centered: false })],
} satisfies Meta<typeof HomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    feedCount: 12,
    filterCount: 2,
    greeting: 'Morning, Jordan',
    intentOption: { label: 'Open to both', color: '#8BAA7A' },
    onPressNotifications: () => undefined,
    unreadCount: 3,
  },
};
