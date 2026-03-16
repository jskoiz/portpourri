import React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../theme/useTheme';
import AppIcon from '../components/ui/AppIcon';
import { GlassView } from '../design/primitives/GlassView';
import type { MainTabParamList } from '../core/navigation/types';
import { useUnreadNotificationCount } from '../features/notifications/hooks/useUnreadNotificationCount';
import { useTabBarVisibility } from './TabBarVisibilityContext';
import { radii } from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, React.ComponentProps<typeof AppIcon>['name']> = {
  Discover: 'compass',
  Explore: 'map-pin',
  Create: 'plus-circle',
  Inbox: 'message-square',
  You: 'user',
};

const TAB_BAR_EXPANDED = Platform.OS === 'ios' ? 62 : 58;
const TAB_BAR_MARGIN_H = 12;
const TAB_BAR_MARGIN_BOTTOM = 8;

function FloatingGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useUnreadNotificationCount();
  const { minimizeProgress } = useTabBarVisibility();

  // Animate height and label opacity
  const tabBarHeight = minimizeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [TAB_BAR_EXPANDED, 46],
    extrapolate: 'clamp',
  });

  const labelOpacity = minimizeProgress.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const labelHeight = minimizeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.tabBarOuter,
        {
          paddingBottom: insets.bottom + TAB_BAR_MARGIN_BOTTOM,
          paddingHorizontal: TAB_BAR_MARGIN_H,
        },
      ]}
    >
      <GlassView
        tier="thick"
        borderRadius={radii.xxl}
        specularHighlight
        style={styles.tabBarGlass}
      >
        <Animated.View style={[styles.tabBarInner, { height: tabBarHeight }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === index;
            const icon = TAB_ICONS[route.name] ?? 'circle';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.iconContainerActive,
                  ]}
                >
                  <AppIcon
                    name={icon}
                    size={18}
                    color={isFocused ? '#1A1A1A' : theme.textMuted}
                  />
                  {route.name === 'Inbox' && unreadCount > 0 ? (
                    <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? '#1A1A1A' : theme.textMuted,
                      fontWeight: isFocused ? '800' : '600',
                      opacity: labelOpacity,
                      height: labelHeight,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Animated.Text>
              </Pressable>
            );
          })}
        </Animated.View>
      </GlassView>
    </Animated.View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Inbox" component={MatchesScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarGlass: {
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(26,26,26,0.08)',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
