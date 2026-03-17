import React, { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import tamaguiConfig from '../../design/tamagui.config';
import { ThemeProvider } from '../../theme/useTheme';
import { colors } from '../../theme/tokens';

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
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <SafeAreaProvider>
          <GestureHandlerRootView
            style={{ flex: 1, backgroundColor: colors.background }}
          >
            <QueryClientProvider client={client}>
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
