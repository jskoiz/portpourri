import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
  Discover: '✦',
  Explore: '◈',
  Create: '+',
  Inbox: '✉',
  You: '◉',
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
      <Text style={{ fontSize: 17, color: focused ? colors.textPrimary : colors.textMuted }}>{icons[routeName]}</Text>
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceGlass,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: typography.caption, fontWeight: '700', letterSpacing: 0.2 },
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Inbox" component={MatchesScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
