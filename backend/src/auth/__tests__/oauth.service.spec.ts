import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { OAuthService } from '../oauth.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  const verifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken,
    })),
    __mockVerifyIdToken: verifyIdToken,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockVerifyIdToken } = require('google-auth-library');

jest.mock('../../config/app.config', () => ({
  appConfig: {
    oauth: {
      google: {
        clientId: 'test-google-client-id',
      },
      apple: {
        clientId: 'test-apple-client-id',
      },
    },
  },
}));

describe('OAuthService', () => {
  let service: OAuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
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

    service = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithGoogle', () => {
    it('should return auth token for existing Google user', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@gmail.com',
        firstName: 'Test',
        isOnboarded: true,
      };

      __mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'test@gmail.com',
          given_name: 'Test',
        }),
      });

      // findFirst for ban/delete check
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-123', isDeleted: false, isBanned: false });
      // upsert returns existing user
      prismaMock.user.upsert.mockResolvedValue(existingUser);

      const result = await service.loginWithGoogle('valid-id-token');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: 'test@gmail.com',
          firstName: 'Test',
          isOnboarded: true,
        },
      });
      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authProvider_providerId: {
              authProvider: AuthProvider.GOOGLE,
              providerId: 'google-123',
            },
          },
        }),
      );
    });

    it('should create a new user when Google user does not exist', async () => {
      const newUser = {
        id: 'user-456',
        email: 'new@gmail.com',
        firstName: 'New',
        isOnboarded: false,
      };

      __mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-456',
          email: 'new@gmail.com',
          given_name: 'New',
        }),
      });

      // findFirst for ban/delete check — no existing user
      prismaMock.user.findFirst.mockResolvedValue(null);
      // upsert creates new user
      prismaMock.user.upsert.mockResolvedValue(newUser);

      const result = await service.loginWithGoogle('valid-id-token');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: 'user-456',
          email: 'new@gmail.com',
          firstName: 'New',
          isOnboarded: false,
        },
      });
      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            email: 'new@gmail.com',
            authProvider: AuthProvider.GOOGLE,
            providerId: 'google-456',
            firstName: 'New',
            isOnboarded: false,
          }),
        }),
      );
    });

    it('should throw UnauthorizedException on invalid Google token', async () => {
      __mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.loginWithGoogle('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Google payload has no sub', async () => {
      __mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'test@gmail.com' }),
      });

      await expect(
        service.loginWithGoogle('token-without-sub'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginWithApple', () => {
    it('should throw UnauthorizedException on invalid Apple token', async () => {
      await expect(
        service.loginWithApple('not-a-jwt'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on malformed Apple JWT', async () => {
      // A JWT with three parts but invalid content
      const fakeJwt = `${Buffer.from('{"alg":"RS256","kid":"fake-kid"}').toString('base64url')}.${Buffer.from('{}').toString('base64url')}.fakesig`;

      await expect(
        service.loginWithApple(fakeJwt),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
