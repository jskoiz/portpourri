import { createTamagui } from '@tamagui/core';
import { defaultConfig } from '@tamagui/config/v4';

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  defaultTheme: 'dark',
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
