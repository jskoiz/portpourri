import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  beginPushRegistration,
  deregisterPushToken as deregisterStoredPushToken,
  endPushRegistration,
  getLastRegisteredPushToken,
  markPushTokenRegistered,
  registerPushToken as registerPushTokenWithBackend,
  resetPushRegistrationState,
} from '../services/pushRegistration';

let notificationHandlerConfigured = false;

export function configureNotificationHandler(): void {
  if (notificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerConfigured = true;
}

/**
 * Request notification permissions from the user.
 * Returns true if permission was granted.
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B4A',
    });
  }

  return true;
}

/**
 * Get the Expo push token for this device.
 * Returns null if the token cannot be obtained.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('Missing EAS project ID for push token registration');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
    return null;
  }
}

/**
 * Register the push token with the backend.
 */
export async function registerPushToken(token: string): Promise<void> {
  await registerPushTokenWithBackend(token);
}

/**
 * Deregister the push token from the backend.
 * Safe to call even if no token was registered.
 */
export async function deregisterPushToken(): Promise<void> {
  await deregisterStoredPushToken();
}

/**
 * Set up listeners for notification interactions (taps).
 * Returns a cleanup function to remove the listener.
 */
export function setupNotificationListeners(
  onNotificationTap: (data: Record<string, unknown>) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: any) => {
      const data = response.notification.request.content.data ?? {};
      onNotificationTap(data as Record<string, unknown>);
    },
  );

  return () => subscription.remove();
}

/**
 * Full registration flow: request permissions, get token, send to backend.
 * Safe to call on every app foreground / login — idempotent on the backend.
 * Handles token refresh by detecting when the token changes.
 * Guards against race conditions from concurrent calls.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!beginPushRegistration()) return;

  try {
    const granted = await requestPermissions();
    if (!granted) return;

    const token = await getExpoPushToken();
    if (!token) return;

    // Skip registration if the token hasn't changed
    if (token === getLastRegisteredPushToken()) return;

    await registerPushToken(token);
    markPushTokenRegistered(token);
  } catch (error) {
    console.warn('Failed to register push token with backend:', error);
  } finally {
    endPushRegistration();
  }
}

export async function getLastNotificationResponseSafe() {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    console.warn('Failed to read last notification response:', error);
    return null;
  }
}

/** Reset internal state — useful for testing. */
export function _resetForTesting(): void {
  resetPushRegistrationState();
  notificationHandlerConfigured = false;
}
