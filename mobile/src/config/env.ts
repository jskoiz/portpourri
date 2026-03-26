import { Platform } from "react-native";

const IOS_SIMULATOR_API_URL = "http://127.0.0.1:3010";
const ANDROID_EMULATOR_API_URL = "http://10.0.2.2:3010";

const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const developmentFallbackUrl =
  process.env.EXPO_PUBLIC_DEV_LAN_API_URL?.trim() ||
  Platform?.select?.({
    ios: IOS_SIMULATOR_API_URL,
    android: ANDROID_EMULATOR_API_URL,
    default: IOS_SIMULATOR_API_URL,
  }) ||
  IOS_SIMULATOR_API_URL;

const apiUrl = explicitApiUrl || (__DEV__ ? developmentFallbackUrl : null);

if (!apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL must be set for preview and production builds.",
  );
}

export const env = {
  apiUrl,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || null,
  storybookEnabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
};
