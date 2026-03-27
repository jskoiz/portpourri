import client from '../../api/client';
import type { AuthResponse, CurrentUser } from '../../api/types';
import { withErrorLogging } from './shared';

function getEmailDomain(email: string): string | undefined {
  const [, domain] = email.split('@');
  return domain || undefined;
}

export const authApi = {
  login: async (payload: { email: string; password: string }) =>
    withErrorLogging('auth', 'login', () =>
      client.post<AuthResponse>('/auth/login', payload),
      {
        context: {
          emailDomain: getEmailDomain(payload.email),
          hasPassword: Boolean(payload.password),
        },
      },
    ),
  signup: async (payload: {
    email: string;
    password: string;
    firstName: string;
    birthdate: string;
    gender: string;
  }) =>
    withErrorLogging('auth', 'signup', () =>
      client.post<AuthResponse>('/auth/signup', payload),
      {
        context: {
          emailDomain: getEmailDomain(payload.email),
          hasFirstName: Boolean(payload.firstName),
          hasBirthdate: Boolean(payload.birthdate),
          gender: payload.gender,
        },
      },
    ),
  me: async (token: string) =>
    withErrorLogging('auth', 'me', () =>
      client.get<CurrentUser>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      {
        context: { authStrategy: 'bearer-token' },
        ignoreErrorKinds: ['unauthorized'],
      },
    ),
  deleteAccount: async () =>
    withErrorLogging('auth', 'deleteAccount', () =>
      client.delete<void>('/auth/me'),
    ),
  googleLogin: async (idToken: string) =>
    withErrorLogging('auth', 'googleLogin', () =>
      client.post<AuthResponse>('/auth/google', { idToken }),
      { context: { provider: 'google' } },
    ),
  appleLogin: async (identityToken: string, fullName?: string) =>
    withErrorLogging('auth', 'appleLogin', () =>
      client.post<AuthResponse>('/auth/apple', { identityToken, fullName }),
      { context: { provider: 'apple' } },
    ),
};
