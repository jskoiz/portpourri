import React, { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { TamaguiProvider } from 'tamagui';
import { ThemeProvider } from '../../theme/useTheme';
import { colors } from '../../theme/tokens';
import { queryClient } from '../../lib/query/queryClient';
import tamaguiConfig from '../../design/tamagui.config';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { initSentry } from '../observability/sentry';

initSentry();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <SafeAreaProvider>
          <GestureHandlerRootView
            style={{ flex: 1, backgroundColor: colors.background }}
          >
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <ThemeProvider>{children}</ThemeProvider>
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </TamaguiProvider>
    </ErrorBoundary>
  );
}
