import React, { PropsWithChildren, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '../../theme/useTheme';
import { lightTheme } from '../../theme/tokens';
import { queryClient } from '../../lib/query/queryClient';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { initSentry } from '../observability/sentry';
import {
  configureNotificationHandler,
  registerForPushNotifications,
  setupNotificationListeners,
} from '../../lib/pushNotifications';

initSentry();

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    configureNotificationHandler();

    const cleanup = setupNotificationListeners((data) => {
      // Deep-link routing based on notification data can be added here.
      // For now we log the tap for debugging.
      if (__DEV__) {
        console.log('[push] Notification tapped:', data);
      }
    });

    const bootstrapTask = InteractionManager.runAfterInteractions(() => {
      registerForPushNotifications().catch((error) => {
        console.warn('Push notification bootstrap failed:', error);
      });
    });

    return () => {
      cleanup();
      bootstrapTask.cancel();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: lightTheme.background }}
        >
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
