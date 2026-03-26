import React, { PropsWithChildren, useState } from 'react';
import { Platform } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { createHarnessQueryClient } from '../../lib/testing/queryTestHarness';
import { ThemeProvider } from '../../theme/useTheme';
import { lightTheme } from '../../theme/tokens';

// BottomSheetModalProvider crashes silently on web — wrap conditionally
function MaybeBottomSheet({ children }: PropsWithChildren) {
  if (Platform.OS === 'web') return <>{children}</>;
  const { BottomSheetModalProvider } =
    require('@gorhom/bottom-sheet') as typeof import('@gorhom/bottom-sheet');
  return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>;
}

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
            <MaybeBottomSheet>
              <ThemeProvider>{children}</ThemeProvider>
            </MaybeBottomSheet>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
