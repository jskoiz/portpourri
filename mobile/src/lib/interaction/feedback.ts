import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/storage';

// ---------------------------------------------------------------------------
// Global enable/disable toggle
// ---------------------------------------------------------------------------
let hapticsEnabled = true;

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  hapticsEnabled = enabled;
  await AsyncStorage.setItem(STORAGE_KEYS.hapticsEnabled, enabled ? '1' : '0');
}

export async function loadHapticsPreference(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.hapticsEnabled);
  // Default to enabled when no preference is stored.
  hapticsEnabled = stored !== '0';
  return hapticsEnabled;
}

// ---------------------------------------------------------------------------
// Internal runner — swallows errors and respects the global toggle.
// ---------------------------------------------------------------------------
async function run(task: () => Promise<void>) {
  if (!hapticsEnabled) return;
  try {
    await task();
  } catch {
    // Haptics should never block product interactions.
  }
}

// ---------------------------------------------------------------------------
// Typed helpers — convenience exports requested by the haptics spec.
// ---------------------------------------------------------------------------
export function hapticLight() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticHeavy() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

export function hapticSuccess() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticWarning() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export function hapticError() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

// ---------------------------------------------------------------------------
// Legacy / semantic aliases — preserved for backward-compatibility.
// ---------------------------------------------------------------------------
export function triggerSelectionHaptic() {
  return run(() => Haptics.selectionAsync());
}

export function triggerSuccessHaptic() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function triggerWarningHaptic() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export function triggerErrorHaptic() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function triggerImpactHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
) {
  return run(() => Haptics.impactAsync(style));
}

export function triggerLightImpactHaptic() {
  return triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
}

export function triggerSheetOpenHaptic() {
  return triggerLightImpactHaptic();
}

export function triggerSheetDismissHaptic() {
  return triggerLightImpactHaptic();
}

export function triggerSheetCommitHaptic() {
  return triggerSelectionHaptic();
}
