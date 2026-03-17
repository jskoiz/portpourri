import * as Location from 'expo-location';
import { profileApi } from '../services/api';

/**
 * Request foreground location permission.
 * Returns true if granted, false otherwise.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get the device's current coordinates.
 * Returns { latitude, longitude } or null if unavailable.
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Push the user's lat/lng to the backend profile endpoint.
 */
export async function updateLocationOnServer(
  latitude: number,
  longitude: number,
): Promise<void> {
  await profileApi.updateProfile({ latitude, longitude });
}

/**
 * All-in-one: request permission, get coordinates, push to server.
 * Returns the coordinates on success, or null if any step fails.
 * Never throws — failures are silently swallowed so the app can
 * continue without location.
 */
export async function refreshUserLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return null;

    const coords = await getCurrentLocation();
    if (!coords) return null;

    await updateLocationOnServer(coords.latitude, coords.longitude);
    return coords;
  } catch {
    return null;
  }
}
