import { PrismaService } from '../prisma/prisma.service';

export interface MatchClassification {
  isDatingMatch: boolean;
  isWorkoutMatch: boolean;
}

export async function deriveMatchClassification(
  prisma: Pick<PrismaService, 'userProfile'>,
  userIds: [string, string],
): Promise<MatchClassification> {
  const profiles = await prisma.userProfile.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      intentDating: true,
      intentWorkout: true,
    },
  });

  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.userId, profile]),
  );
  const [firstProfile, secondProfile] = userIds.map((userId) =>
    profilesByUserId.get(userId),
  );

  if (!firstProfile || !secondProfile) {
    return {
      isDatingMatch: true,
      isWorkoutMatch: false,
    };
  }

  return {
    isDatingMatch: firstProfile.intentDating && secondProfile.intentDating,
    isWorkoutMatch: firstProfile.intentWorkout && secondProfile.intentWorkout,
  };
}
