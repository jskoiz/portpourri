import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createHarnessQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

export const createTestQueryClient = createHarnessQueryClient;

export function createQueryTestHarness() {
  const queryClient = createHarnessQueryClient();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { queryClient, wrapper: Wrapper };
}
