import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockedCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns access token and user shape when login receives a user object', async () => {
    jwtServiceMock.sign.mockReturnValue('signed-token');

    const result = await service.login({
      id: 'user-1',
      email: 'test@example.com',
      isOnboarded: true,
    });

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      email: 'test@example.com',
      sub: 'user-1',
    });
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        isOnboarded: true,
      },
    });
  });

  it('normalizes signup email before checking for conflicts and creating the user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'jordan@example.com',
      isOnboarded: false,
    });
    jwtServiceMock.sign.mockReturnValue('signed-token');
    mockedHash.mockResolvedValue('hashed-password');

    const result = await service.signup({
      email: ' Jordan@Example.com ',
      password: 'password123',
      firstName: 'Jordan',
      birthdate: '1995-02-03',
      gender: 'non-binary',
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'jordan@example.com',
          mode: 'insensitive',
        },
        authProvider: 'email',
      },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'jordan@example.com',
        passwordHash: 'hashed-password',
      }),
    });
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 'user-1',
        email: 'jordan@example.com',
        isOnboarded: false,
      },
    });
  });

  it('rejects signup when the normalized email already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'Jordan@Example.com',
    });

    await expect(
      service.signup({
        email: ' Jordan@Example.com ',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: 'non-binary',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects signup when the normalized email is blank', async () => {
    await expect(
      service.signup({
        email: '   ',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: 'non-binary',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('deletes the current user account when it exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
    prismaMock.user.delete.mockResolvedValue({ id: 'user-1' });

    await expect(service.deleteAccount('user-1')).resolves.toBeUndefined();
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('rejects account deletion for unknown users', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.deleteAccount('missing-user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it('rejects login when both credentials and trusted identity are missing', async () => {
    await expect(service.login({ email: '   ' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtServiceMock.sign).not.toHaveBeenCalled();
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('normalizes login email before looking up credentials', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'jordan@example.com',
      passwordHash: 'stored-hash',
      isOnboarded: true,
    });
    jwtServiceMock.sign.mockReturnValue('signed-token');
    mockedCompare.mockResolvedValue(true);

    const result = await service.login({
      email: ' Jordan@Example.com ',
      password: 'password123',
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'jordan@example.com',
          mode: 'insensitive',
        },
        authProvider: 'email',
      },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'stored-hash');
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 'user-1',
        email: 'jordan@example.com',
        isOnboarded: true,
      },
    });
  });

  it('matches legacy mixed-case emails during login lookup', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'Jordan@Example.com',
      passwordHash: 'stored-hash',
      isOnboarded: true,
    });
    jwtServiceMock.sign.mockReturnValue('signed-token');
    mockedCompare.mockResolvedValue(true);

    const result = await service.login({
      email: 'jordan@example.com',
      password: 'password123',
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'jordan@example.com',
          mode: 'insensitive',
        },
        authProvider: 'email',
      },
    });
    expect(result.user.email).toBe('Jordan@Example.com');
  });
});
