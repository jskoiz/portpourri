import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signup(data: any) {
        const { email, password, firstName, birthdate, gender } = data;

        const existing = await this.prisma.user.findFirst({
            where: { email },
        });
        if (existing) throw new ConflictException('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName,
                birthdate: new Date(birthdate),
                gender,
                authProvider: 'email',
            },
        });

        return this.login(user);
    }

    async login(user: any) {
        // If user is passed directly (from signup), use it. 
        // If login DTO is passed, validate it.
        let userId = user.id;
        let userEmail = user.email;
        let isOnboarded = user.isOnboarded || false;

        if (!userId && user.email && user.password) {
            const foundUser = await this.prisma.user.findFirst({
                where: { email: user.email },
            });
            if (!foundUser || !foundUser.passwordHash) {
                throw new UnauthorizedException('Invalid credentials');
            }
            const isMatch = await bcrypt.compare(user.password, foundUser.passwordHash);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid credentials');
            }
            userId = foundUser.id;
            userEmail = foundUser.email;
            isOnboarded = foundUser.isOnboarded; // Update isOnboarded from fetched user
        }

        const payload = { email: userEmail, sub: userId };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: userId,
                email: userEmail,
                isOnboarded: isOnboarded,
            }
        };
    }

    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                birthdate: true,
                gender: true,
                pronouns: true,
                isOnboarded: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }
}
