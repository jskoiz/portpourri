import type { Preview } from '@storybook/react-native-web-vite';
import React from 'react';
import { StorybookProviders } from '../src/stories/support';

const preview: Preview = {
  decorators: [
    (Story) => (
      <StorybookProviders>
        <Story />
      </StorybookProviders>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
