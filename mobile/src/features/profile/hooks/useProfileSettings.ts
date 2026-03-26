import { useEffect, useState } from 'react';
import { isHapticsEnabled, loadHapticsPreference, setHapticsEnabled } from '../../../lib/interaction/feedback';

export function useProfileSettings() {
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [showBuildInfo, setShowBuildInfo] = useState(false);

  useEffect(() => {
    loadHapticsPreference().then(setHapticsOn).catch(() => undefined);
  }, []);

  return {
    hapticsOn,
    showBuildInfo,
    toggleBuildInfo: () => setShowBuildInfo((current) => !current),
    toggleHaptics: (enabled: boolean) => {
      setHapticsOn(enabled);
      void setHapticsEnabled(enabled);
    },
  };
}
