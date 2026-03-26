import React, { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ThemeProvider } from '../../theme/useTheme';
import { lightTheme } from '../../theme/tokens';

function createStorybookClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function StorybookProviders({ children }: PropsWithChildren) {
  const [client] = useState(createStorybookClient);

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
