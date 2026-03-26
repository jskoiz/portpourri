import client from '../../api/client';
import type { AuthenticatedUser, AuthResponse } from '../../api/types';
import { withErrorLogging } from './shared';

export const authApi = {
  login: async (payload: { email: string; password: string }) =>
    withErrorLogging('auth', 'login', () =>
      client.post<AuthResponse>('/auth/login', payload),
      { email: payload.email },
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
      { email: payload.email },
    ),
  me: async (token: string) =>
    withErrorLogging('auth', 'me', () =>
      client.get<AuthenticatedUser>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ),
  deleteAccount: async () =>
    withErrorLogging('auth', 'deleteAccount', () =>
      client.delete<void>('/auth/me'),
    ),
};
