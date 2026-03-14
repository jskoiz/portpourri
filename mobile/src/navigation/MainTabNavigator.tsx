import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {
  CreatePreviewScreen,
  DiscoverPreviewScreen,
  ExplorePreviewScreen,
  InboxPreviewScreen,
  ProfilePreviewScreen,
} from '../screens/AppStorePreviewScreens';
import { Text, View, Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';
import AppIcon from '../components/ui/AppIcon';
import { useNotificationStore } from '../store/notificationStore';

const Tab = createBottomTabNavigator();

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
        backgroundColor: focused ? 'rgba(138,120,255,0.18)' : 'transparent',
      }}
    >
      <AppIcon
        name={icon}
        size={17}
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
              color: theme.textInverse,
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

const screenshotInitialRoute =
  process.env.EXPO_PUBLIC_SCREENSHOT_ROUTE?.trim() || 'Discover';

export default function MainTabNavigator({
  previewMode = false,
}: {
  previewMode?: boolean;
}) {
  const theme = useTheme();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const syncUnreadCount = useNotificationStore((state) => state.syncUnreadCount);
  const DiscoverComponent = previewMode ? DiscoverPreviewScreen : HomeScreen;
  const ExploreComponent = previewMode ? ExplorePreviewScreen : ExploreScreen;
  const CreateComponent = previewMode ? CreatePreviewScreen : CreateScreen;
  const InboxComponent = previewMode ? InboxPreviewScreen : MatchesScreen;
  const YouComponent = previewMode ? ProfilePreviewScreen : ProfileScreen;

  useFocusEffect(
    React.useCallback(() => {
      void syncUnreadCount();
    }, [syncUnreadCount]),
  );

  return (
    <Tab.Navigator
      initialRouteName={previewMode ? screenshotInitialRoute : undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(25,32,51,0.92)',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          shadowColor: '#000000',
          shadowOpacity: 0.10,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
          elevation: 10,
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
      <Tab.Screen name="Discover" component={DiscoverComponent} />
      <Tab.Screen name="Explore" component={ExploreComponent} />
      <Tab.Screen name="Create" component={CreateComponent} />
      <Tab.Screen name="Inbox" component={InboxComponent} />
      <Tab.Screen name="You" component={YouComponent} />
    </Tab.Navigator>
  );
}
