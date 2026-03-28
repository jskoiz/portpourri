import { useState, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { env } from '../../../config/env';

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: env.googleClientId ?? undefined,
    clientId: env.googleClientId ?? undefined,
  });

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!env.googleClientId || !promptAsync) {
      return null;
    }

    setIsLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.id_token) {
        return result.params.id_token;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync]);

  return { signIn, isLoading, isReady: !!request };
}
