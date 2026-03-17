import React, { useEffect, useRef } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
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

import MainTabNavigator from "./MainTabNavigator";
import { setUnauthorizedHandler } from "../api/authSession";
import { useTheme } from "../theme/useTheme";
import { TabBarVisibilityProvider } from "./TabBarVisibilityContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['brdg://', 'com.avmillabs.brdg://'],
  config: {
    screens: {
      Main: {
        screens: {
          Discover: 'home',
          Explore: 'explore',
          Inbox: 'matches',
          You: 'profile',
        },
      },
      Chat: 'chat/:matchId',
      ProfileDetail: 'profile/:userId',
      EventDetail: 'event/:eventId',
    },
  },
};

export default function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const loadToken = useAuthStore((state) => state.loadToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const theme = useTheme();

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
    <NavigationContainer theme={navigationTheme} linking={linking}>
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
            <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="ProfileDetail"
              component={ProfileDetailScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ presentation: 'modal' }} />
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
