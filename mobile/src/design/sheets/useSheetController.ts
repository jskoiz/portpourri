import { useCallback, useMemo, useRef, useState } from 'react';
import {
  triggerSheetDismissHaptic,
  triggerSheetOpenHaptic,
} from '../../lib/interaction/feedback';

export function useSheetController() {
  const ref = useRef<{ present: () => void; dismiss: () => void } | null>(null);
  const [visible, setVisible] = useState(false);
  const closeReason = useRef<'dismiss' | 'programmatic' | null>(null);

  const open = useCallback(() => {
    void triggerSheetOpenHaptic();
    closeReason.current = null;
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    closeReason.current = 'programmatic';
    ref.current?.dismiss();
    setVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    closeReason.current = 'dismiss';
    ref.current?.dismiss();
    setVisible(false);
  }, []);

  const handleChange = useCallback((index: number) => {
    if (index === -1 && closeReason.current === null) {
      closeReason.current = 'dismiss';
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (closeReason.current === 'dismiss') {
      void triggerSheetDismissHaptic();
    }
    closeReason.current = null;
  }, []);

  const sheetProps = useMemo(
    () => ({
      onChangeIndex: handleChange,
      onDismiss: handleDismiss,
      onRequestClose: dismiss,
      refObject: ref,
      visible,
    }),
    [dismiss, handleChange, handleDismiss, visible],
  );

  return {
    dismiss,
    handleChange,
    handleDismiss,
    ref,
    sheetProps,
    visible,
    open,
    close,
  };
}
