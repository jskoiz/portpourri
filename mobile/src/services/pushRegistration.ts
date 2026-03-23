import client from '../api/client';

let lastRegisteredToken: string | null = null;
let registrationInFlight = false;

export function beginPushRegistration(): boolean {
  if (registrationInFlight) {
    return false;
  }

  registrationInFlight = true;
  return true;
}

export function endPushRegistration(): void {
  registrationInFlight = false;
}

export function getLastRegisteredPushToken(): string | null {
  return lastRegisteredToken;
}

export function markPushTokenRegistered(token: string): void {
  lastRegisteredToken = token;
}

export async function registerPushToken(token: string): Promise<void> {
  await client.post('/auth/push-token', { token });
}

export async function deregisterPushToken(): Promise<void> {
  try {
    await client.delete('/auth/push-token');
  } catch (error) {
    // Best-effort: if this fails (e.g. token already expired), just log it.
    console.warn('Failed to deregister push token:', error);
  } finally {
    lastRegisteredToken = null;
  }
}

export function resetPushRegistrationState(): void {
  lastRegisteredToken = null;
  registrationInFlight = false;
}
