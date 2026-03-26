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
import { ToastOverlay } from '../../components/ui/ToastOverlay';
import { initSentry, logDevOnly } from '../observability/sentry';
import { installGlobalErrorHandler } from '../observability/globalErrorHandler';
import {
  configureNotificationHandler,
  registerForPushNotifications,
} from '../../lib/pushNotifications';
import { loadHapticsPreference } from '../../lib/interaction/feedback';

initSentry();
installGlobalErrorHandler();

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    configureNotificationHandler();

    const bootstrapTask = InteractionManager.runAfterInteractions(() => {
      registerForPushNotifications().catch((error) => {
        logDevOnly('warn', 'Push notification bootstrap failed', error);
      });
      loadHapticsPreference().catch(() => {
        // Non-critical — defaults to enabled.
      });
    });

    return () => {
      bootstrapTask.cancel();
    };
  }, []);

  return (
    <ErrorBoundary name="root">
      <SafeAreaProvider>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: lightTheme.background }}
        >
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <ThemeProvider>
                {children}
                <ToastOverlay />
              </ThemeProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
