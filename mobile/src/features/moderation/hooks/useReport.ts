import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { ReportPayload } from '../../../api/types';
import { moderationApi } from '../../../services/api';
import {
  getModerationFailureAlert,
  getModerationSuccessAlert,
} from '../moderationFeedback';

export function useReport(options?: { onSuccess?: () => void }) {
  const mutation = useMutation({
    mutationFn: async (payload: ReportPayload) => (await moderationApi.report(payload)).data,
    onSuccess: () => {
      const alert = getModerationSuccessAlert('report');
      Alert.alert(alert.title, alert.message);
      options?.onSuccess?.();
    },
    onError: (error) => {
      const alert = getModerationFailureAlert('report', error);
      Alert.alert(alert.title, alert.message);
    },
  });

  const report = async (payload: ReportPayload) => {
    try {
      return await mutation.mutateAsync(payload);
    } catch {
      return undefined;
    }
  };

  return {
    report,
    isLoading: mutation.isPending,
  };
}
