import { Platform } from 'react-native';

const LAN_HOST = '192.168.4.154';
const IOS_SIMULATOR_API_URL = 'http://127.0.0.1:3000';
const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';
const LAN_API_URL = `http://${LAN_HOST}:3000`;

const defaultApiUrl = Platform.select({
  ios: IOS_SIMULATOR_API_URL,
  android: ANDROID_EMULATOR_API_URL,
  default: LAN_API_URL,
});

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || defaultApiUrl,
};
