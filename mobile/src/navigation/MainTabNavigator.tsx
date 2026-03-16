import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';
import AppIcon from '../components/ui/AppIcon';
import type { MainTabParamList } from '../core/navigation/types';
import { useUnreadNotificationCount } from '../features/notifications/hooks/useUnreadNotificationCount';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, React.ComponentProps<typeof AppIcon>['name']> = {
  Discover: 'compass',
  Explore: 'map-pin',
  Create: 'plus-circle',
  Inbox: 'message-square',
  You: 'user',
};

function TabIcon({
  routeName,
  focused,
  unreadCount,
}: {
  routeName: string;
  focused: boolean;
  unreadCount: number;
}) {
  const theme = useTheme();
  const icon = TAB_ICONS[routeName] ?? 'circle';
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? 'rgba(124,106,247,0.08)' : 'transparent',
      }}
    >
      <AppIcon
        name={icon}
        size={19}
        color={focused ? theme.primary : theme.textMuted}
      />
      {routeName === 'Inbox' && unreadCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -1,
            right: -3,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accent,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              color: '#FFFFFF',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function TabLabel({ color, children, focused }: { color: string; children: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? '700' : '600',
        letterSpacing: 0.2,
        marginTop: 1,
        color,
      }}
    >
      {children}
    </Text>
  );
}

export default function MainTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useUnreadNotificationCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(0,0,0,0.06)',
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} unreadCount={unreadCount} />
        ),
        tabBarLabel: ({ color, children, focused }) => (
          <TabLabel color={color} focused={focused}>
            {children as string}
          </TabLabel>
        ),
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
