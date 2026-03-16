import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProviders } from './src/core/providers/AppProviders';
import { env } from './src/config/env';
import { useFontsLoaded } from './src/lib/fonts';

function AppRoot() {
  const fontsLoaded = useFontsLoaded();

  if (!fontsLoaded) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="small" color="#B0A89E" />
      </View>
    );
  }

  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFBF8',
  },
});

export default function App() {
  if (env.storybookEnabled) {
    const StorybookUIRoot = require('./.rnstorybook').default;
    return <StorybookUIRoot />;
  }

  return <AppRoot />;
}
