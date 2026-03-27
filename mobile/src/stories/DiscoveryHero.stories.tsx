import type { Meta, StoryObj } from '@storybook/react-native';
import { HomeHero } from '../features/discovery/components/HomeHero';
import { lightTheme } from '../theme/tokens';
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
    intentOption: { label: '2 intents', color: lightTheme.accentPrimary },
    onPressNotifications: () => undefined,
    unreadCount: 3,
  },
};

export const NoUnread: Story = {
  args: {
    feedCount: 4,
    filterCount: 0,
    greeting: 'Tonight, Jordan',
    intentOption: { label: '2 intents', color: lightTheme.accentPrimary },
    onPressNotifications: () => undefined,
    unreadCount: 0,
  },
};
