import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) { }

    async updateFitnessProfile(userId: string, data: any) {
        const profile = await this.prisma.userFitnessProfile.upsert({
            where: { userId },
            update: {
                ...data,
            },
            create: {
                userId,
                ...data,
            },
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { isOnboarded: true },
        });

        return profile;
    }

    async updateProfile(userId: string, data: any) {
        return this.prisma.userProfile.upsert({
            where: { userId },
            update: { ...data },
            create: { userId, ...data },
        });
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                fitnessProfile: true,
                profile: true,
                photos: {
                    where: { isHidden: false },
                    orderBy: { sortOrder: 'asc' }
                },
            },
        });

        if (!user) return null;

        return {
            ...user,
            age: this.calculateAge(user.birthdate),
        };
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
}
