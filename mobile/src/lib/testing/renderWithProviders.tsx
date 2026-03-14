import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/useTheme';

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const client = createTestClient();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
