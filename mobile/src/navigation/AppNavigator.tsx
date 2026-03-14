import React, { useEffect } from "react";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const loadToken = useAuthStore((state) => state.loadToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const theme = useTheme();

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.background,
      card: theme.background,
      border: theme.border,
      primary: theme.primary,
      text: theme.textPrimary,
      notification: theme.accent,
    },
  };

  useEffect(() => {
    const cleanupUnauthorizedHandler = setUnauthorizedHandler(clearSession);
    loadToken();

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
    <NavigationContainer theme={navigationTheme}>
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
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen
              name="ProfileDetail"
              component={ProfileDetailScreen}
            />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
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
  );
}
