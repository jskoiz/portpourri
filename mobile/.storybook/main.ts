import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { mergeConfig } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.?(ts|tsx|js|jsx)'],
  framework: '@storybook/react-native-web-vite',
  addons: [],
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        // Provide env vars that the app's config/env.ts requires at build time
        'process.env.EXPO_PUBLIC_API_URL': JSON.stringify('http://localhost:3010'),
        'process.env.EXPO_PUBLIC_STORYBOOK_ENABLED': JSON.stringify('true'),
        '__DEV__': JSON.stringify(true),
      },
      resolve: {
        alias: {
          // Stub native-only modules that can't run in Vite/web
          'expo-modules-core': resolve(__dirname, './expo-modules-stub.ts'),
          'expo-haptics': resolve(__dirname, './expo-modules-stub.ts'),
          '@gorhom/bottom-sheet': resolve(__dirname, './gorhom-bottom-sheet-stub.ts'),
        },
      },
    });
  },
};

export default config;
