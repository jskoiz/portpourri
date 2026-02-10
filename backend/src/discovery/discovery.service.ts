import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscoveryService {
    constructor(private prisma: PrismaService) { }

    async getFeed(userId: string) {
        // Get IDs of users already liked
        const sentLikes = await this.prisma.like.findMany({
            where: { fromUserId: userId },
            select: { toUserId: true },
        });

        // Get IDs of users already passed
        const sentPasses = await this.prisma.pass.findMany({
            where: { fromUserId: userId },
            select: { toUserId: true },
        });

        const excludedIds = [
            ...sentLikes.map(l => l.toUserId),
            ...sentPasses.map(p => p.toUserId),
            userId
        ];

        // Fetch potential matches
        const users = await this.prisma.user.findMany({
            where: {
                id: { notIn: excludedIds },
                isDeleted: false,
                isBanned: false,
                isOnboarded: true,
            },
            include: {
                fitnessProfile: true,
                profile: true,
                photos: {
                    where: { isHidden: false },
                    orderBy: { sortOrder: 'asc' }
                },
            },
            take: 20,
        });

        return users.map(user => ({
            ...user,
            age: this.calculateAge(user.birthdate),
        }));
    }

    private calculateAge(birthdate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const m = today.getMonth() - birthdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }
        return age;
    }

    async likeUser(userId: string, targetUserId: string) {
        // Check if already liked
        const existingLike = await this.prisma.like.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: userId,
                    toUserId: targetUserId,
                },
            },
        });

        if (existingLike) return { status: 'already_liked' };

        // Create Like
        await this.prisma.like.create({
            data: {
                fromUserId: userId,
                toUserId: targetUserId,
            },
        });

        // Check for mutual like
        const mutualLike = await this.prisma.like.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: targetUserId,
                    toUserId: userId,
                },
            },
        });

        if (mutualLike) {
            // Create Match (ensure consistent ordering for @@unique([userAId, userBId]))
            const [userAId, userBId] = [userId, targetUserId].sort();

            const match = await this.prisma.match.upsert({
                where: {
                    userAId_userBId: {
                        userAId,
                        userBId,
                    },
                },
                create: {
                    userAId,
                    userBId,
                    isDatingMatch: true, // TODO: check intents
                },
                update: {
                    updatedAt: new Date(),
                },
            });

            return { status: 'match', match };
        }

        return { status: 'liked' };
    }

    async passUser(userId: string, targetUserId: string) {
        // Check if already passed
        const existingPass = await this.prisma.pass.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: userId,
                    toUserId: targetUserId,
                },
            },
        });

        if (existingPass) return { status: 'already_passed' };

        await this.prisma.pass.create({
            data: {
                fromUserId: userId,
                toUserId: targetUserId,
            },
        });

        return { status: 'passed' };
    }
}
