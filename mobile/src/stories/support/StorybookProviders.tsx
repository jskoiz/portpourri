import React, { PropsWithChildren, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { createHarnessQueryClient } from '../../lib/testing/queryTestHarness';
import { ThemeProvider } from '../../theme/useTheme';
import { lightTheme } from '../../theme/tokens';

export function StorybookProviders({ children }: PropsWithChildren) {
  const [client] = useState(() => {
    const nextClient = createHarnessQueryClient();
    nextClient.setDefaultOptions({
      queries: {
        ...nextClient.getDefaultOptions().queries,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
      mutations: nextClient.getDefaultOptions().mutations,
    });
    return nextClient;
  });

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: lightTheme.background }}
        >
          <QueryClientProvider client={client}>
            <BottomSheetModalProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
