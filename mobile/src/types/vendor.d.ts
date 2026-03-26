declare module 'react-native-gesture-handler' {
  import type * as React from 'react';
  export const GestureHandlerRootView: React.ComponentType<any>;
}

declare module '@gorhom/bottom-sheet' {
  import type * as React from 'react';

  export type BottomSheetModal = {
    present(): void;
    dismiss(): void;
  };

  export const BottomSheetModalProvider: React.ComponentType<any>;
  export const BottomSheetModal: React.ComponentType<any>;
  export const BottomSheetBackdrop: React.ComponentType<any>;
  export const BottomSheetScrollView: React.ComponentType<any>;
  export const BottomSheetView: React.ComponentType<any>;
}

declare module 'expo-notifications' {
  export const AndroidImportance: { MAX: number };
  export function setNotificationHandler(handler: any): void;
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function setNotificationChannelAsync(channel: string, config: any): Promise<void>;
  export function getExpoPushTokenAsync(options: any): Promise<{ data: string }>;
  export function addNotificationResponseReceivedListener(
    listener: (response: any) => void,
  ): { remove: () => void };
  export function getLastNotificationResponseAsync(): Promise<any>;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any, schemaOptions?: any, resolverOptions?: any): any;
}
