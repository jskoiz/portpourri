import type { Meta, StoryObj } from '@storybook/react-native';
import { Button } from '../design/primitives';
import { withStorySurface } from './support';

const meta = {
  title: 'Design/Button',
  component: Button,
  decorators: [withStorySurface()],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Join BRDG',
    onPress: () => undefined,
  },
};

export const Secondary: Story = {
  args: {
    label: 'Maybe Later',
    onPress: () => undefined,
    variant: 'secondary',
  },
};

export const Accent: Story = {
  args: {
    label: 'Create Activity',
    onPress: () => undefined,
    variant: 'accent',
  },
};

export const Ghost: Story = {
  args: {
    label: 'Skip',
    onPress: () => undefined,
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    label: 'Delete account',
    onPress: () => undefined,
    variant: 'danger',
  },
};

export const Glass: Story = {
  args: {
    label: 'Glass Button',
    onPress: () => undefined,
    variant: 'glass',
  },
};

export const GlassProminent: Story = {
  args: {
    label: 'Glass Prominent',
    onPress: () => undefined,
    variant: 'glassProminent',
  },
};
