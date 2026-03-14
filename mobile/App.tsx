import 'react-native-gesture-handler';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProviders } from './src/core/providers/AppProviders';
import { env } from './src/config/env';

function AppRoot() {
  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  );
}

export default function App() {
  if (env.storybookEnabled) {
    const StorybookUIRoot = require('./.rnstorybook').default;
    return <StorybookUIRoot />;
  }

  return <AppRoot />;
}
