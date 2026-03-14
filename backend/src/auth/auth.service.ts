import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface SignupDto {
  email: string;
  password: string;
  firstName: string;
  birthdate: string;
  gender: string;
}

export interface LoginDto {
  email?: string | null;
  password?: string;
}

export interface AuthResult {
  access_token: string;
  user: { id: string; email: string; isOnboarded: boolean };
}

type AuthenticatedUser = {
  id: string;
  email: string | null;
  isOnboarded: boolean;
};

type EmailAuthUser = AuthenticatedUser & {
  passwordHash: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizeEmail(email?: string | null) {
    return email?.trim().toLowerCase() ?? '';
  }

  private buildEmailLookup(email: string) {
    return {
      email: {
        equals: email,
        mode: 'insensitive' as const,
      },
      authProvider: 'email',
    };
  }

  private async findEmailAuthUser(email: string): Promise<EmailAuthUser | null> {
    return this.prisma.user.findFirst({
      where: this.buildEmailLookup(email),
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        isOnboarded: true,
        passwordHash: true,
      },
    });
  }

  async signup(data: SignupDto): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(data.email);
    const { password, firstName, birthdate, gender } = data;

    try {
      if (!normalizedEmail) {
        throw new BadRequestException('Email is required');
      }

      if (!password || !password.trim()) {
        throw new BadRequestException('Password is required');
      }

      const existing = await this.prisma.user.findFirst({
        where: this.buildEmailLookup(normalizedEmail),
      });
      if (existing) {
        this.logger.warn(`Signup conflict for email=${normalizedEmail}`);
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashedPassword,
          firstName,
          birthdate: new Date(birthdate),
          gender,
          authProvider: 'email',
        },
      });

      return this.issueAuthToken(user);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Signup failed for email=${normalizedEmail}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  async login(user: LoginDto): Promise<AuthResult> {
    let userEmail = this.normalizeEmail(user.email);
    const password = user.password ?? '';

    try {
      const hasCredentials = Boolean(userEmail && password);

      if (!hasCredentials) {
        this.logger.warn('Login rejected due to incomplete credentials');
        throw new UnauthorizedException('Invalid credentials');
      }

      const foundUser = await this.findEmailAuthUser(userEmail);
      if (!foundUser || !foundUser.passwordHash) {
        this.logger.warn(`Login rejected for email=${userEmail}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
      if (!isMatch) {
        this.logger.warn(`Login rejected for email=${userEmail}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      userEmail = foundUser.email ?? '';
      return this.issueAuthToken(foundUser);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const loginEmail = user?.email ?? userEmail;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Login failed for email=${loginEmail}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  private issueAuthToken(user: AuthenticatedUser): AuthResult {
    const userEmail = user.email?.trim() ?? '';
    const payload = { email: userEmail, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: userEmail,
        isOnboarded: user.isOnboarded,
      },
    };
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

  async deleteAccount(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        this.logger.warn(`Delete account lookup failed for userId=${userId}`);
        throw new UnauthorizedException('User not found');
      }

      await this.prisma.user.delete({
        where: { id: userId },
      });

      this.logger.log(
        `Deleted account for userId=${user.id}${user.email ? ` email=${user.email}` : ''}`,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Delete account failed for userId=${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }
}
