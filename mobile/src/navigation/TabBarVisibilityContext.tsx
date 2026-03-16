import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

interface TabBarVisibility {
  /** Animated value 0 (expanded) → 1 (minimized). */
  minimizeProgress: Animated.Value;
  /** Pass to ScrollView/FlatList onScroll for auto-minimize. */
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Immediately expand the tab bar. */
  expand: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibility | null>(null);

const SCROLL_THRESHOLD = 10;

export function TabBarVisibilityProvider({ children }: PropsWithChildren) {
  const minimizeProgress = useRef(new Animated.Value(0)).current;
  const lastOffsetRef = useRef(0);
  const isMinimizedRef = useRef(false);

  const expand = useCallback(() => {
    if (isMinimizedRef.current) {
      isMinimizedRef.current = false;
      Animated.spring(minimizeProgress, {
        toValue: 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 2,
      }).start();
    }
  }, [minimizeProgress]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Skip animation if user prefers reduced motion
      AccessibilityInfo.isReduceMotionEnabled?.().then((reduceMotion) => {
        if (reduceMotion) return;

        const currentOffset = event.nativeEvent.contentOffset.y;
        const delta = currentOffset - lastOffsetRef.current;

        if (delta > SCROLL_THRESHOLD && currentOffset > 50 && !isMinimizedRef.current) {
          isMinimizedRef.current = true;
          Animated.spring(minimizeProgress, {
            toValue: 1,
            useNativeDriver: false,
            speed: 20,
            bounciness: 2,
          }).start();
        } else if (delta < -SCROLL_THRESHOLD && isMinimizedRef.current) {
          isMinimizedRef.current = false;
          Animated.spring(minimizeProgress, {
            toValue: 0,
            useNativeDriver: false,
            speed: 20,
            bounciness: 2,
          }).start();
        }

        lastOffsetRef.current = currentOffset;
      });
    },
    [minimizeProgress],
  );

  return (
    <TabBarVisibilityContext.Provider
      value={{ minimizeProgress, handleScroll, expand }}
    >
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility(): TabBarVisibility {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    // Graceful fallback if used outside provider (e.g. in tests)
    return {
      minimizeProgress: new Animated.Value(0),
      handleScroll: () => {},
      expand: () => {},
    };
  }
  return ctx;
}
