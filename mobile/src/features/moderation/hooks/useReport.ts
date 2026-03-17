import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { ReportPayload, ReportResponse } from '../../../api/types';
import { moderationApi } from '../../../services/api';

export function useReport(options?: { onSuccess?: () => void }) {
  const mutation = useMutation({
    mutationFn: async (payload: ReportPayload) =>
      (await moderationApi.report(payload)).data as ReportResponse,
    onSuccess: () => {
      Alert.alert(
        'Report submitted',
        'Thank you for helping keep BRDG safe. We will review this report.',
      );
      options?.onSuccess?.();
    },
    onError: () => {
      Alert.alert(
        'Could not submit report',
        'Something went wrong. Please try again later.',
      );
    },
  });

  return {
    report: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
