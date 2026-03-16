/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { deriveMatchClassification } from './match-classification';
import { PrismaService } from '../prisma/prisma.service';

describe('deriveMatchClassification', () => {
  const prisma = {
    userProfile: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives dating/workout flags from shared user intents', async () => {
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      {
        userId: 'user-1',
        intentDating: false,
        intentWorkout: true,
      },
      {
        userId: 'user-2',
        intentDating: true,
        intentWorkout: true,
      },
    ] as any);

    await expect(
      deriveMatchClassification(prisma, ['user-1', 'user-2']),
    ).resolves.toEqual({
      isDatingMatch: false,
      isWorkoutMatch: true,
    });
  });

  it('falls back to dating-only when profile intent data is incomplete', async () => {
    jest.mocked(prisma.userProfile.findMany).mockResolvedValue([
      {
        userId: 'user-1',
        intentDating: false,
        intentWorkout: true,
      },
    ] as any);

    await expect(
      deriveMatchClassification(prisma, ['user-1', 'user-2']),
    ).resolves.toEqual({
      isDatingMatch: true,
      isWorkoutMatch: false,
    });
  });
});
