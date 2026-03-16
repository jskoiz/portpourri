import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthProvider, Gender } from '@prisma/client';
import type { SignupDto, LoginDto } from './auth.dto';

export type { SignupDto, LoginDto };

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

const GENDER_MAP: Record<string, Gender> = {
  woman: Gender.FEMALE,
  man: Gender.MALE,
  'non-binary': Gender.NON_BINARY,
  female: Gender.FEMALE,
  male: Gender.MALE,
};

const ALLOWED_GENDERS = ['woman', 'man', 'non-binary'] as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeEmail(email?: string | null) {
    return email?.trim().toLowerCase() ?? '';
  }

  private parseBirthdate(birthdate: string) {
    const trimmedBirthdate = birthdate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedBirthdate)) {
      throw new BadRequestException('Birthdate must use YYYY-MM-DD format');
    }

    const parsedBirthdate = new Date(`${trimmedBirthdate}T00:00:00.000Z`);
    if (Number.isNaN(parsedBirthdate.getTime())) {
      throw new BadRequestException('Birthdate must be a real date');
    }

    if (parsedBirthdate.toISOString().slice(0, 10) !== trimmedBirthdate) {
      throw new BadRequestException('Birthdate must be a real date');
    }

    return parsedBirthdate;
  }

  private normalizeGender(gender: string): Gender {
    const normalizedGender = gender.trim().toLowerCase();
    if (
      !ALLOWED_GENDERS.includes(
        normalizedGender as (typeof ALLOWED_GENDERS)[number],
      )
    ) {
      throw new BadRequestException(
        'Gender must be one of: woman, man, non-binary',
      );
    }

    const mapped = GENDER_MAP[normalizedGender];
    if (!mapped) {
      throw new BadRequestException(
        'Gender must be one of: woman, man, non-binary',
      );
    }

    return mapped;
  }

  private buildEmailLookup(email: string) {
    return {
      email: {
        equals: email,
        mode: 'insensitive' as const,
      },
      authProvider: AuthProvider.EMAIL,
    };
  }

  private async findEmailAuthUser(email: string): Promise<EmailAuthUser | null> {
    return this.prisma.user.findFirst({
      where: {
        ...this.buildEmailLookup(email),
        isDeleted: false,
        isBanned: false,
      },
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

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    if (!password || !password.trim()) {
      throw new BadRequestException('Password is required');
    }

    const parsedBirthdate = this.parseBirthdate(birthdate);
    const normalizedGender = this.normalizeGender(gender);

    const existing = await this.prisma.user.findFirst({
      where: this.buildEmailLookup(normalizedEmail),
    });
    if (existing) {
      this.logger.warn(`Signup conflict for email=${normalizedEmail}`);
      throw new BadRequestException('Unable to create account');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        firstName,
        birthdate: parsedBirthdate,
        gender: normalizedGender,
        authProvider: AuthProvider.EMAIL,
      },
    });

    return this.issueAuthToken(user);
  }

  async login(user: LoginDto): Promise<AuthResult> {
    let userEmail = this.normalizeEmail(user.email);
    const password = user.password ?? '';

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

  async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string | null;
    firstName: string;
    birthdate: Date | null;
    gender: Gender;
    pronouns: string | null;
    isOnboarded: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false, isBanned: false },
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
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      this.logger.warn(`Delete account lookup failed for userId=${userId}`);
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        email: `deleted-${userId}@deleted.invalid`,
        passwordHash: null,
        phoneNumber: null,
        providerId: null,
        firstName: 'Deleted',
        pronouns: null,
      },
    });

    this.logger.log(
      `Soft-deleted account for userId=${user.id}${user.email ? ` email=${user.email}` : ''}`,
    );
  }
}
