import 'reflect-metadata';
import { DiscoveryController } from './discovery.controller';

/**
 * Verify that rate-limit decorators on discovery endpoints
 * have the expected values.
 */
describe('Discovery endpoint rate-limit decorators', () => {
  const TTL_KEY = 'THROTTLER:TTLdefault';
  const LIMIT_KEY = 'THROTTLER:LIMITdefault';

  const getThrottleMetadata = (
    methodName: string,
  ): { ttl: number; limit: number } | null => {
    const target = DiscoveryController.prototype;
    const method = target[methodName as keyof typeof target] as Function;
    const ttl = Reflect.getMetadata(TTL_KEY, method);
    const limit = Reflect.getMetadata(LIMIT_KEY, method);

    if (ttl === undefined || limit === undefined) return null;
    return { ttl, limit };
  };

  it('like endpoint is rate-limited to 20 requests per minute', () => {
    const meta = getThrottleMetadata('likeUser');
    expect(meta).not.toBeNull();
    expect(meta!.ttl).toBe(60_000);
    expect(meta!.limit).toBe(20);
  });

  it('pass endpoint is rate-limited to 20 requests per minute', () => {
    const meta = getThrottleMetadata('passUser');
    expect(meta).not.toBeNull();
    expect(meta!.ttl).toBe(60_000);
    expect(meta!.limit).toBe(20);
  });
});
