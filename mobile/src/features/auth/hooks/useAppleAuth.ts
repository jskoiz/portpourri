import { useState, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export function useAppleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const isAvailable = Platform.OS === 'ios';

  const signIn = useCallback(async (): Promise<{ identityToken: string; fullName?: string } | null> => {
    if (!isAvailable) return null;

    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) return null;

      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ') || undefined;

      return { identityToken: credential.identityToken, fullName };
    } catch (error: unknown) {
      // User cancelled — not an error
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return null;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  return { signIn, isLoading, isAvailable };
}
