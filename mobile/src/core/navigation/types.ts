import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { EventDetail, EventSummary, Match, User } from '../../api/types';
import type { SessionIntent } from '../../types/sessionIntent';

export type MainTabParamList = {
  Discover: undefined;
  Explore: undefined;
  Create: undefined;
  Inbox: undefined;
  You: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
  Chat: {
    matchId: string;
    user: Match['user'] | User;
    prefillMessage?: string;
  };
  ProfileDetail: {
    user: User;
    userId?: string;
    sessionIntent?: SessionIntent;
  };
  EventDetail: {
    eventId: string;
    event?: EventSummary | EventDetail | null;
  };
  MyEvents: undefined;
  Notifications: undefined;
  Settings: undefined;
  Login: undefined;
  Signup: undefined;
};

export type RootStackScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

export type MainTabScreenProps<RouteName extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, RouteName>,
    NativeStackScreenProps<RootStackParamList>
  >;
