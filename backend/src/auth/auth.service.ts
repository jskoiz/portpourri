import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(data: any) {
    const { email, password, firstName, birthdate, gender } = data;

    try {
      const existing = await this.prisma.user.findFirst({
        where: { email },
      });
      if (existing) {
        this.logger.warn(`Signup conflict for email=${email}`);
        throw new ConflictException('User already exists');
      }

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
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Signup failed for email=${email}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async login(user: any) {
    let userId = user.id;
    let userEmail = user.email;
    let isOnboarded = user.isOnboarded || false;

    try {
      if (!userId && user.email && user.password) {
        const foundUser = await this.prisma.user.findFirst({
          where: { email: user.email },
        });
        if (!foundUser || !foundUser.passwordHash) {
          this.logger.warn(`Login rejected for email=${user.email}`);
          throw new UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(
          user.password,
          foundUser.passwordHash,
        );
        if (!isMatch) {
          this.logger.warn(`Login rejected for email=${user.email}`);
          throw new UnauthorizedException('Invalid credentials');
        }
        userId = foundUser.id;
        userEmail = foundUser.email;
        isOnboarded = foundUser.isOnboarded;
      }

      const payload = { email: userEmail, sub: userId };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: userId,
          email: userEmail,
          isOnboarded: isOnboarded,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const loginEmail = user?.email ?? userEmail;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Login failed for email=${loginEmail}: ${message}`, stack);
      throw error;
    }
  }

  async getCurrentUser(userId: string) {
    try {
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
        this.logger.warn(`Current user lookup failed for userId=${userId}`);
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Current user lookup failed for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }
}
