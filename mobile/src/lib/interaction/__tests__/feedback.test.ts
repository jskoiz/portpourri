import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../constants/storage';
import {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
  isHapticsEnabled,
  setHapticsEnabled,
  loadHapticsPreference,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerWarningHaptic,
  triggerErrorHaptic,
  triggerImpactHaptic,
  triggerSheetOpenHaptic,
  triggerSheetDismissHaptic,
  triggerSheetCommitHaptic,
} from '../feedback';

describe('feedback haptic utilities', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset to enabled
    await setHapticsEnabled(true);
  });

  // -----------------------------------------------------------------------
  // Typed helper functions
  // -----------------------------------------------------------------------
  describe('typed helpers', () => {
    it('hapticLight calls impactAsync with Light style', async () => {
      await hapticLight();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('hapticMedium calls impactAsync with Medium style', async () => {
      await hapticMedium();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('hapticHeavy calls impactAsync with Heavy style', async () => {
      await hapticHeavy();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('hapticSuccess calls notificationAsync with Success type', async () => {
      await hapticSuccess();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('hapticWarning calls notificationAsync with Warning type', async () => {
      await hapticWarning();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    it('hapticError calls notificationAsync with Error type', async () => {
      await hapticError();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });
  });

  // -----------------------------------------------------------------------
  // Legacy aliases
  // -----------------------------------------------------------------------
  describe('legacy aliases', () => {
    it('triggerSelectionHaptic calls selectionAsync', async () => {
      await triggerSelectionHaptic();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });

    it('triggerSuccessHaptic calls notificationAsync with Success', async () => {
      await triggerSuccessHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('triggerWarningHaptic calls notificationAsync with Warning', async () => {
      await triggerWarningHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    it('triggerErrorHaptic calls notificationAsync with Error', async () => {
      await triggerErrorHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });

    it('triggerImpactHaptic defaults to Medium', async () => {
      await triggerImpactHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('triggerSheetOpenHaptic uses Light impact', async () => {
      await triggerSheetOpenHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggerSheetDismissHaptic uses Light impact', async () => {
      await triggerSheetDismissHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggerSheetCommitHaptic calls selectionAsync', async () => {
      await triggerSheetCommitHaptic();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Enable / disable toggle
  // -----------------------------------------------------------------------
  describe('global enable/disable toggle', () => {
    it('defaults to enabled', () => {
      expect(isHapticsEnabled()).toBe(true);
    });

    it('prevents haptic calls when disabled', async () => {
      await setHapticsEnabled(false);
      expect(isHapticsEnabled()).toBe(false);

      await hapticLight();
      await hapticSuccess();
      await triggerSelectionHaptic();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });

    it('re-enables haptic calls when toggled back on', async () => {
      await setHapticsEnabled(false);
      await setHapticsEnabled(true);

      await hapticLight();
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });

    it('persists preference to AsyncStorage', async () => {
      await setHapticsEnabled(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.hapticsEnabled, '0');

      await setHapticsEnabled(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.hapticsEnabled, '1');
    });

    it('loadHapticsPreference reads from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('0');
      const result = await loadHapticsPreference();
      expect(result).toBe(false);
      expect(isHapticsEnabled()).toBe(false);
    });

    it('loadHapticsPreference defaults to enabled when no value stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const result = await loadHapticsPreference();
      expect(result).toBe(true);
      expect(isHapticsEnabled()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Error swallowing
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('swallows errors from expo-haptics', async () => {
      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('no vibrator'));
      // Should not throw
      await hapticLight();
    });
  });
});
