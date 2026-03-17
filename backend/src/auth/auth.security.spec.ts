import 'reflect-metadata';
import { AuthController } from './auth.controller';

/**
 * Verify that the @Throttle decorators are applied with the expected limits
 * on security-sensitive auth endpoints. This catches accidental changes to
 * rate-limit values during refactoring.
 */
describe('Auth endpoint rate-limit decorators', () => {
  const TTL_KEY = 'THROTTLER:TTLdefault';
  const LIMIT_KEY = 'THROTTLER:LIMITdefault';

  const getThrottleMetadata = (
    methodName: string,
  ): { ttl: number; limit: number } | null => {
    const target = AuthController.prototype;
    const method = target[methodName as keyof typeof target] as Function;
    const ttl = Reflect.getMetadata(TTL_KEY, method);
    const limit = Reflect.getMetadata(LIMIT_KEY, method);

    if (ttl === undefined || limit === undefined) return null;
    return { ttl, limit };
  };

  it('login endpoint is rate-limited to 5 requests per minute', () => {
    const meta = getThrottleMetadata('login');
    expect(meta).not.toBeNull();
    expect(meta!.ttl).toBe(60_000);
    expect(meta!.limit).toBe(5);
  });

  it('signup endpoint is rate-limited to 3 requests per minute', () => {
    const meta = getThrottleMetadata('signup');
    expect(meta).not.toBeNull();
    expect(meta!.ttl).toBe(60_000);
    expect(meta!.limit).toBe(3);
  });
});
