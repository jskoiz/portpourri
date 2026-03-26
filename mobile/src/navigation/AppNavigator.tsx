import React, { useCallback, useEffect, useRef } from "react";
import {
  AppState,
  InteractionManager,
  type AppStateStatus,
} from "react-native";
import {
  DefaultTheme,
  NavigationContainer,
  type NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";
import type { RootStackParamList } from "../core/navigation/types";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileDetailScreen from "../screens/ProfileDetailScreen";
import { ActivityIndicator, View } from "react-native";
import EventDetailScreen from "../screens/EventDetailScreen";
import MyEventsScreen from "../screens/MyEventsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import { refreshUserLocation } from "../lib/location";
import {
  getLastNotificationResponseSafe,
  setupNotificationListeners,
} from "../lib/pushNotifications";
import {
  addBreadcrumb,
  captureException,
  logDevOnly,
} from "../core/observability/sentry";

import MainTabNavigator from "./MainTabNavigator";
import { withBoundary } from "../components/withBoundary";
import { setUnauthorizedHandler } from "../api/authSession";
import { useTheme } from "../theme/useTheme";
import { TabBarVisibilityProvider } from "./TabBarVisibilityContext";
import {
  linkingConfig,
  handleNotificationNavigation,
  type NotificationData,
} from "../lib/deepLinks";

const Stack = createNativeStackNavigator<RootStackParamList>();

const BoundedChat = withBoundary(ChatScreen, 'chat');
const BoundedEventDetail = withBoundary(EventDetailScreen, 'events');
const BoundedProfileDetail = withBoundary(ProfileDetailScreen, 'profile');

/** Dev-only: auto-login with preview credentials when no token is stored. */
let devAutoLoginDone = false;

function useDevAutoLogin() {
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!__DEV__ || isLoading || token || devAutoLoginDone) return;
    devAutoLoginDone = true;

    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:3010/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "preview.lana@brdg.local",
            password: "PreviewPass123!",
          }),
        });
        if (!res.ok) {
          devAutoLoginDone = false;
          return;
        }
        const data = await res.json();
        const { STORAGE_KEYS } = require("../constants/storage");
        const SecureStore = require("expo-secure-store");
        await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, data.access_token);
        useAuthStore.setState({ token: data.access_token, user: data.user, isLoading: false });
      } catch (e: any) {
        devAutoLoginDone = false;
        console.warn("[dev-auto-login]", e?.message || e);
      }
    })();
  }, [token, isLoading]);
}

export default function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const loadToken = useAuthStore((state) => state.loadToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const theme = useTheme();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useDevAutoLogin();

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#FDFBF8',
      card: '#FFFFFF',
      text: '#2C2420',
      border: '#E8E2DA',
      primary: '#C4A882',
      notification: theme.accent,
    },
  };

  const autoLoginInFlight = useRef(false);

  const routeNotificationTap = useCallback((data: Record<string, unknown>) => {
    if (!navigationRef.current) {
      return;
    }

    const result = handleNotificationNavigation(
      data as NotificationData,
      navigationRef.current,
    );
    if (result.ok) {
      return;
    }

    addBreadcrumb({
      category: 'notifications',
      type: 'navigation',
      level: result.kind === 'malformed' ? 'warning' : 'info',
      message: `[notifications] tap ${result.kind}`,
      data: {
        type: result.type,
        error: result.error,
        ...data,
      },
    });
    logDevOnly('warn', '[notifications] Unable to route notification tap', {
      type: result.type,
      error: result.error,
      data,
    });

    if (result.kind === 'malformed') {
      captureException(new Error('Malformed notification tap payload'), {
        tags: { domain: 'notifications', kind: result.kind, type: result.type },
        extra: { data, error: result.error },
      });
    }
  }, []);

  useEffect(() => {
    const cleanupUnauthorizedHandler = setUnauthorizedHandler(clearSession);

    if (!autoLoginInFlight.current) {
      autoLoginInFlight.current = true;
      loadToken().finally(() => {
        autoLoginInFlight.current = false;
      });
    }

    return cleanupUnauthorizedHandler;
  }, [clearSession, loadToken]);

  // Handle app-killed-state launches: check the last notification response on boot.
  useEffect(() => {
    if (!token) return;

    const cleanup = setupNotificationListeners(routeNotificationTap);

    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      getLastNotificationResponseSafe().then((response) => {
        if (cancelled || !response) return;
        const data = response.notification.request.content.data as unknown as
          | NotificationData
          | undefined;
        if (data) {
          routeNotificationTap(data as Record<string, unknown>);
        }
      });
    });

    return () => {
      cancelled = true;
      cleanup();
      task.cancel();
    };
  }, [routeNotificationTap, token]);

  // Refresh user location on initial auth and whenever the app comes to the foreground.
  useEffect(() => {
    if (!token) return;

    const safeRefreshUserLocation = () => {
      refreshUserLocation().catch((error) => {
        console.warn("[location] Failed to refresh user location:", error);
      });
    };

    const task = InteractionManager.runAfterInteractions(() => {
      safeRefreshUserLocation();
    });

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        safeRefreshUserLocation();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      task.cancel();
      subscription.remove();
    };
  }, [token]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <TabBarVisibilityProvider>
    <NavigationContainer ref={navigationRef} linking={linkingConfig} theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: "default",
        }}
      >
        {token ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Chat" component={BoundedChat} options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="ProfileDetail"
              component={BoundedProfileDetail}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="EventDetail" component={BoundedEventDetail} options={{ presentation: 'modal' }} />
            <Stack.Screen name="MyEvents" component={MyEventsScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </TabBarVisibilityProvider>
  );
}
