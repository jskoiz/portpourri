import * as Haptics from 'expo-haptics';

async function run(task: () => Promise<void>) {
  try {
    await task();
  } catch {
    // Haptics should never block product interactions.
  }
}

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

export function triggerSheetOpenHaptic() {
  return triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
}

export function triggerSheetDismissHaptic() {
  return triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
}

export function triggerSheetCommitHaptic() {
  return triggerSelectionHaptic();
}
