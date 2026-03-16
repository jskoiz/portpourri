import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthProvider, Gender } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Gender as AppGender } from '../common/enums';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedHash = bcrypt.hash as jest.Mock;
const mockedCompare = bcrypt.compare as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
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

  it('returns access token and user shape when login receives valid credentials', async () => {
    jwtServiceMock.sign.mockReturnValue('signed-token');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      isOnboarded: true,
    });
    mockedCompare.mockImplementation(() => Promise.resolve(true));

    const result = await service.login({
      email: 'test@example.com',
      password: 'pw',
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'test@example.com',
          mode: 'insensitive',
        },
        authProvider: AuthProvider.EMAIL,
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
    mockedHash.mockImplementation(() => Promise.resolve('hashed-password'));

    const result = await service.signup({
      email: ' Jordan@Example.com ',
      password: 'password123',
      firstName: 'Jordan',
      birthdate: '1995-02-03',
      gender: AppGender.NonBinary,
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'jordan@example.com',
          mode: 'insensitive',
        },
        authProvider: AuthProvider.EMAIL,
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
        gender: AppGender.NonBinary,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects signup when the normalized email is blank', async () => {
    await expect(
      service.signup({
        email: '   ',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: AppGender.NonBinary,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects signup when the password is empty', async () => {
    await expect(
      service.signup({
        email: 'test@example.com',
        password: '',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: AppGender.NonBinary,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects signup when the password is whitespace only', async () => {
    await expect(
      service.signup({
        email: 'test@example.com',
        password: '   ',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: AppGender.NonBinary,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects signup when the birthdate is not a real calendar date', async () => {
    await expect(
      service.signup({
        email: 'jordan@example.com',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-31',
        gender: AppGender.NonBinary,
      }),
    ).rejects.toThrow('Birthdate must be a real date');

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('normalizes gender values before creating the user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'jordan@example.com',
      isOnboarded: false,
    });
    jwtServiceMock.sign.mockReturnValue('signed-token');
    mockedHash.mockImplementation(() => Promise.resolve('hashed-password'));

    await service.signup({
      email: 'jordan@example.com',
      password: 'password123',
      firstName: 'Jordan',
      birthdate: '1995-02-03',
      gender: ' Non-Binary ' as unknown as AppGender,
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        gender: Gender.NON_BINARY,
      }),
    });
  });

  it('rejects with birthdate error before checking for duplicate email', async () => {
    // Even if the email already exists, a bad birthdate should surface first
    // so invalid input is rejected without leaking email existence.
    await expect(
      service.signup({
        email: 'jordan@example.com',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-31',
        gender: AppGender.NonBinary,
      }),
    ).rejects.toThrow('Birthdate must be a real date');

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects signup when gender is outside the allowed options', async () => {
    await expect(
      service.signup({
        email: 'jordan@example.com',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: 'other' as unknown as AppGender,
      }),
    ).rejects.toThrow('Gender must be one of: woman, man, non-binary');

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('returns a signed auth result for newly created signup users', async () => {
    jwtServiceMock.sign.mockReturnValue('signed-token');
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'new@example.com',
      isOnboarded: false,
    });

    const result = await service.signup({
      email: 'new@example.com',
      password: 'pw',
      firstName: 'New',
      birthdate: '1996-02-03',
      gender: AppGender.Woman,
    });

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      email: 'new@example.com',
      sub: 'new-user',
    });
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 'new-user',
        email: 'new@example.com',
        isOnboarded: false,
      },
    });
  });

  it('soft-deletes the current user account when it exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
    prismaMock.user.update.mockResolvedValue({ id: 'user-1', isDeleted: true });

    await expect(service.deleteAccount('user-1')).resolves.toBeUndefined();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        isDeleted: true,
        passwordHash: null,
        phoneNumber: null,
        providerId: null,
      }),
    });
  });

  it('rejects account deletion for unknown users', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.deleteAccount('missing-user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('rejects login when credentials are incomplete', async () => {
    await expect(
      service.login({ email: '   ', password: '' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
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
    mockedCompare.mockImplementation(() => Promise.resolve(true));

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
        authProvider: AuthProvider.EMAIL,
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

  it('rejects login when the user is not found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtServiceMock.sign).not.toHaveBeenCalled();
  });

  it('rejects login when the password does not match', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'stored-hash',
      isOnboarded: true,
    });
    mockedCompare.mockImplementation(() => Promise.resolve(false));

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtServiceMock.sign).not.toHaveBeenCalled();
  });

  it('rejects login when passwordHash is null (social-only account)', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'social@example.com',
      passwordHash: null,
      isOnboarded: true,
    });

    await expect(
      service.login({ email: 'social@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockedCompare).not.toHaveBeenCalled();
  });

  it('returns the current user when found', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      isOnboarded: true,
    });

    const result = await service.getCurrentUser('user-1');
    expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com' });
  });

  it('rejects getCurrentUser for deleted or unknown users', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(service.getCurrentUser('deleted-user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('matches legacy mixed-case emails during login lookup', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'Jordan@Example.com',
      passwordHash: 'stored-hash',
      isOnboarded: true,
    });
    jwtServiceMock.sign.mockReturnValue('signed-token');
    mockedCompare.mockImplementation(() => Promise.resolve(true));

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
        authProvider: AuthProvider.EMAIL,
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
    expect(result.user.email).toBe('Jordan@Example.com');
  });
});
