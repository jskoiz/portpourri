import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { PrismaService } from '../prisma/prisma.service';
import { appConfig } from '../config/app.config';
import Redis from 'ioredis';

// ── In-memory Redis mock ────────────────────────────────────────────────────

function createRedisMock() {
  const store = new Map<string, { value: string; expiresAt: number | null }>();

  const mock = {
    get: jest.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: jest.fn(async (key: string, value: string, ...args: unknown[]) => {
      let expiresAt: number | null = null;
      // Parse EX argument: set(key, value, 'EX', seconds)
      if (args[0] === 'EX' && typeof args[1] === 'number') {
        expiresAt = Date.now() + args[1] * 1000;
      }
      store.set(key, { value, expiresAt });
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      return store.delete(key) ? 1 : 0;
    }),
    quit: jest.fn(async () => 'OK'),
    /** Test helper: clear the store between tests */
    __clear: () => store.clear(),
    /** Test helper: inspect raw store */
    __store: store,
  };

  return mock as unknown as jest.Mocked<Redis> & {
    __clear: () => void;
    __store: Map<string, { value: string; expiresAt: number | null }>;
  };
}

// ── Test suite ──────────────────────────────────────────────────────────────

const userUpdate = jest.fn();
const userFindUnique = jest.fn();

const prisma = {
  user: {
    update: userUpdate,
    findUnique: userFindUnique,
  },
} as unknown as PrismaService;

describe('VerificationService', () => {
  let service: VerificationService;
  let redisMock: ReturnType<typeof createRedisMock>;

  beforeEach(() => {
    userUpdate.mockReset();
    userFindUnique.mockReset();
    userFindUnique.mockResolvedValue({
      email: 'alice@example.com',
      phoneNumber: '+18085551234',
      hasVerifiedEmail: false,
      hasVerifiedPhone: false,
    });

    redisMock = createRedisMock();
    service = VerificationService.createWithRedis(prisma, redisMock as unknown as Redis);
  });

  // ── start ────────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('returns a masked email and dev code', async () => {
      const result = await service.start('user-1', 'email', 'alice@example.com');

      expect(result.started).toBe(true);
      expect(result.channel).toBe('email');
      expect(result.maskedTarget).toMatch(/^a\*\*\*@example\.com$/);
      expect(result.devCode).toMatch(/^\d{6}$/);
    });

    it('stores the code in Redis with TTL', async () => {
      await service.start('user-1', 'email', 'alice@example.com');

      expect(redisMock.set).toHaveBeenCalledWith(
        'verification:user-1:email',
        expect.any(String),
        'EX',
        600,
      );
    });

    it('rejects start when the user does not exist', async () => {
      userFindUnique.mockResolvedValueOnce(null);

      await expect(
        service.start('missing-user', 'email', 'alice@example.com'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects start when the target does not match the account', async () => {
      await expect(
        service.start('user-1', 'email', 'someone-else@example.com'),
      ).rejects.toThrow('Verification target does not match your account');
    });

    it('rejects start when the channel is already verified', async () => {
      userFindUnique.mockResolvedValueOnce({
        email: 'alice@example.com',
        phoneNumber: '+18085551234',
        hasVerifiedEmail: true,
        hasVerifiedPhone: false,
      });

      await expect(
        service.start('user-1', 'email', 'alice@example.com'),
      ).rejects.toThrow('Verification is already complete');
    });

    it('returns a masked phone and dev code', async () => {
      const result = await service.start('user-1', 'phone', '+18085551234');

      expect(result.started).toBe(true);
      expect(result.maskedTarget).toBe('***34');
      expect(result.devCode).toMatch(/^\d{6}$/);
    });

    it('does NOT return devCode when isProduction is true', async () => {
      const replaced = jest.replaceProperty(appConfig as { isProduction: boolean }, 'isProduction', true);
      try {
        const result = await service.start('user-1', 'email', 'alice@example.com');

        expect(result.started).toBe(true);
        expect(result).not.toHaveProperty('devCode');
      } finally {
        replaced.restore();
      }
    });

    it('overwrites a previous pending entry for the same channel', async () => {
      const r1 = await service.start('user-1', 'email', 'alice@example.com');
      const r2 = await service.start('user-1', 'email', 'alice@example.com');

      expect(r1.devCode).not.toBeUndefined();
      expect(r2.devCode).not.toBeUndefined();
    });
  });

  // ── confirm ──────────────────────────────────────────────────────────────────

  describe('confirm', () => {
    it('returns verified:false for wrong code', async () => {
      await service.start('user-1', 'email', 'alice@example.com');

      const result = await service.confirm('user-1', 'email', '000000');
      expect(result).toEqual({ verified: false });
      expect(userUpdate).not.toHaveBeenCalled();
    });

    it('invalidates the pending code after too many wrong attempts', async () => {
      const { devCode } = await service.start(
        'user-1',
        'email',
        'alice@example.com',
      );

      for (let i = 0; i < 5; i += 1) {
        await expect(
          service.confirm('user-1', 'email', '000000'),
        ).resolves.toEqual({ verified: false });
      }

      const result = await service.confirm('user-1', 'email', devCode!);
      expect(result).toEqual({ verified: false });
      expect(userUpdate).not.toHaveBeenCalled();
    });

    it('returns verified:false when no pending entry', async () => {
      const result = await service.confirm('user-1', 'email', '123456');
      expect(result).toEqual({ verified: false });
    });

    it('returns verified:false when the code has expired', async () => {
      jest.useFakeTimers();
      const issuedAt = new Date('2026-01-01T00:00:00.000Z');

      try {
        jest.setSystemTime(issuedAt);

        const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
        expect(devCode).toBeDefined();

        jest.setSystemTime(new Date(issuedAt.getTime() + 10 * 60 * 1000 + 1));

        const result = await service.confirm('user-1', 'email', devCode!);
        expect(result).toEqual({ verified: false });
        expect(userUpdate).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('verifies email and updates user when code matches', async () => {
      const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
      expect(devCode).toBeDefined();
      userFindUnique.mockResolvedValue({
        email: 'alice@example.com',
        phoneNumber: null,
      });
      userUpdate.mockResolvedValue({});

      const result = await service.confirm('user-1', 'email', devCode!);
      expect(result).toEqual({ verified: true });
      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { hasVerifiedEmail: true },
        }),
      );
    });

    it('verifies phone and updates user when code matches', async () => {
      const { devCode } = await service.start('user-1', 'phone', '+18085551234');
      expect(devCode).toBeDefined();
      userFindUnique.mockResolvedValue({
        email: 'alice@example.com',
        phoneNumber: '+18085551234',
      });
      userUpdate.mockResolvedValue({});

      const result = await service.confirm('user-1', 'phone', devCode!);
      expect(result).toEqual({ verified: true });
      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { hasVerifiedPhone: true },
        }),
      );
    });

    it('clears the pending entry after successful confirmation', async () => {
      const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
      expect(devCode).toBeDefined();
      userFindUnique.mockResolvedValue({
        email: 'alice@example.com',
        phoneNumber: null,
      });
      userUpdate.mockResolvedValue({});

      await service.confirm('user-1', 'email', devCode!);

      // Second attempt with same code should fail
      const again = await service.confirm('user-1', 'email', devCode!);
      expect(again).toEqual({ verified: false });
    });

    it('prevents double-verification when two requests race with the same code', async () => {
      const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
      expect(devCode).toBeDefined();
      userFindUnique.mockResolvedValue({
        email: 'alice@example.com',
        phoneNumber: null,
      });

      userUpdate.mockResolvedValue({});

      // Both calls run concurrently; the atomic redis.del ensures only one wins.
      const [r1, r2] = await Promise.all([
        service.confirm('user-1', 'email', devCode!),
        service.confirm('user-1', 'email', devCode!),
      ]);

      // Only one of the two concurrent calls should succeed.
      const successes = [r1, r2].filter((r) => r.verified === true).length;
      expect(successes).toBe(1);
      // The DB should only have been called once.
      expect(userUpdate).toHaveBeenCalledTimes(1);
    });

    it('restores the pending entry after target mismatch so the code can be retried', async () => {
      const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
      expect(devCode).toBeDefined();
      userFindUnique.mockResolvedValue({
        email: 'someone-else@example.com',
        phoneNumber: null,
      });

      const result = await service.confirm('user-1', 'email', devCode!);

      expect(result).toEqual({ verified: false });
      expect(userUpdate).not.toHaveBeenCalled();

      userFindUnique.mockResolvedValueOnce({
        email: 'alice@example.com',
        phoneNumber: null,
      });
      userUpdate.mockResolvedValueOnce({});

      const retry = await service.confirm('user-1', 'email', devCode!);
      expect(retry).toEqual({ verified: true });
      expect(userUpdate).toHaveBeenCalledTimes(1);
    });

    it('restores the pending entry after update failure so the code can be retried', async () => {
      const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
      expect(devCode).toBeDefined();
      userFindUnique.mockResolvedValue({
        email: 'alice@example.com',
        phoneNumber: null,
      });
      userUpdate.mockRejectedValueOnce(new Error('temporary failure'));

      await expect(service.confirm('user-1', 'email', devCode!)).rejects.toThrow(
        'temporary failure',
      );
      expect(userUpdate).toHaveBeenCalledTimes(1);

      userUpdate.mockResolvedValueOnce({});

      const retry = await service.confirm('user-1', 'email', devCode!);
      expect(retry).toEqual({ verified: true });
      expect(userUpdate).toHaveBeenCalledTimes(2);
    });

    it('removes the key from Redis when the code is consumed', async () => {
      const { devCode } = await service.start('user-1', 'email', 'alice@example.com');
      userFindUnique.mockResolvedValue({
        email: 'alice@example.com',
        phoneNumber: null,
      });
      userUpdate.mockResolvedValue({});

      await service.confirm('user-1', 'email', devCode!);

      expect(redisMock.del).toHaveBeenCalledWith('verification:user-1:email');
    });
  });

  // ── status ───────────────────────────────────────────────────────────────────

  describe('status', () => {
    it('delegates to prisma and returns user verification fields', async () => {
      userFindUnique.mockResolvedValue({
        hasVerifiedEmail: true,
        hasVerifiedPhone: false,
        email: 'alice@example.com',
        phoneNumber: null,
      });

      const result = await service.status('user-1');
      expect(result).toMatchObject({
        hasVerifiedEmail: true,
        hasVerifiedPhone: false,
      });
    });
  });
});
