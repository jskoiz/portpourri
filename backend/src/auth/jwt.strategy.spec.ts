jest.mock('../config/app.config', () => ({
  appConfig: {
    jwt: { secret: 'test-secret' },
  },
}));

import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findFirst: jest.Mock } };

  const payload = { sub: 'user-1', email: 'alice@example.com' };

  beforeEach(() => {
    prisma = { user: { findFirst: jest.fn() } };
    strategy = new JwtStrategy(prisma as unknown as PrismaService);
  });

  it('returns the user when active and not banned/deleted', async () => {
    const dbUser = { id: 'user-1', email: 'alice@example.com' };
    prisma.user.findFirst.mockResolvedValue(dbUser);

    const result = await strategy.validate(payload);

    expect(result).toEqual(dbUser);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', isDeleted: false, isBanned: false },
      select: { id: true, email: true },
    });
  });

  it.each([
    'deleted',
    'banned',
    'non-existent',
  ])('rejects a %s user with UnauthorizedException', async (scenario) => {
    // All three cases result in findFirst returning null because the
    // query filters on isDeleted: false and isBanned: false.
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('User no longer valid'),
    );
  });
});
