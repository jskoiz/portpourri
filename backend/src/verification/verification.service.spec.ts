import { VerificationService } from './verification.service';
import { PrismaService } from '../prisma/prisma.service';

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

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerificationService(prisma);
  });

  // ── start ────────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('returns a masked email and dev code', () => {
      const result = service.start('user-1', 'email', 'alice@example.com');

      expect(result.started).toBe(true);
      expect(result.channel).toBe('email');
      expect(result.maskedTarget).toMatch(/^a\*\*\*@example\.com$/);
      expect(result.devCode).toMatch(/^\d{6}$/);
    });

    it('returns a masked phone and dev code', () => {
      const result = service.start('user-1', 'phone', '+18085551234');

      expect(result.started).toBe(true);
      expect(result.maskedTarget).toBe('***34');
      expect(result.devCode).toMatch(/^\d{6}$/);
    });

    it('overwrites a previous pending entry for the same channel', () => {
      const r1 = service.start('user-1', 'email', 'alice@example.com');
      const r2 = service.start('user-1', 'email', 'alice@example.com');

      expect(r1.devCode).not.toBeUndefined();
      expect(r2.devCode).not.toBeUndefined();
    });
  });

  // ── confirm ──────────────────────────────────────────────────────────────────

  describe('confirm', () => {
    it('returns verified:false for wrong code', async () => {
      service.start('user-1', 'email', 'alice@example.com');

      const result = await service.confirm('user-1', 'email', '000000');
      expect(result).toEqual({ verified: false });
      expect(userUpdate).not.toHaveBeenCalled();
    });

    it('returns verified:false when no pending entry', async () => {
      const result = await service.confirm('user-1', 'email', '123456');
      expect(result).toEqual({ verified: false });
    });

    it('verifies email and updates user when code matches', async () => {
      const { devCode } = service.start('user-1', 'email', 'alice@example.com');
      userUpdate.mockResolvedValue({});

      const result = await service.confirm('user-1', 'email', devCode);
      expect(result).toEqual({ verified: true });
      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { hasVerifiedEmail: true },
        }),
      );
    });

    it('verifies phone and updates user when code matches', async () => {
      const { devCode } = service.start('user-1', 'phone', '+18085551234');
      userUpdate.mockResolvedValue({});

      const result = await service.confirm('user-1', 'phone', devCode);
      expect(result).toEqual({ verified: true });
      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { hasVerifiedPhone: true },
        }),
      );
    });

    it('clears the pending entry after successful confirmation', async () => {
      const { devCode } = service.start('user-1', 'email', 'alice@example.com');
      userUpdate.mockResolvedValue({});

      await service.confirm('user-1', 'email', devCode);

      // Second attempt with same code should fail
      const again = await service.confirm('user-1', 'email', devCode);
      expect(again).toEqual({ verified: false });
    });

    it('prevents double-verification when two requests race with the same code', async () => {
      const { devCode } = service.start('user-1', 'email', 'alice@example.com');

      // Simulate two concurrent confirm calls – both start before either resolves.
      let resolveFirst!: () => void;
      userUpdate
        .mockImplementationOnce(
          () => new Promise<void>((res) => { resolveFirst = res; }),
        )
        .mockResolvedValueOnce({});

      const first = service.confirm('user-1', 'email', devCode);
      const second = service.confirm('user-1', 'email', devCode);

      // Let the first DB call finish.
      resolveFirst();

      const [r1, r2] = await Promise.all([first, second]);

      // Only one of the two concurrent calls should succeed.
      const successes = [r1, r2].filter((r) => r.verified === true).length;
      expect(successes).toBe(1);
      // The DB should only have been called once.
      expect(userUpdate).toHaveBeenCalledTimes(1);
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
