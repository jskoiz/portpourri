import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthResponseSchema, CurrentUserSchema } from '@contracts';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import type { LoginDto } from './auth.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { Gender } from '../common/enums';
import { expectSchema } from '../../test-support/expect-schema';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    signup: jest.fn(),
    getCurrentUser: jest.fn(),
    deleteAccount: jest.fn(),
    registerPushToken: jest.fn(),
  };

  const oauthServiceMock = {
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: OAuthService,
          useValue: oauthServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates login to auth service', async () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'pw' };
    const authResult = {
      access_token: 'token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        isOnboarded: false,
      },
    };
    authServiceMock.login.mockResolvedValue(authResult);

    await expect(controller.login(dto)).resolves.toEqual(authResult);
    expectSchema(AuthResponseSchema, authResult);
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });

  it('delegates authenticated account deletion to auth service', async () => {
    authServiceMock.deleteAccount.mockResolvedValue(undefined);
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

    await expect(controller.deleteAccount(req)).resolves.toBeUndefined();
    expect(authServiceMock.deleteAccount).toHaveBeenCalledWith('user-1');
  });

  it('delegates signup to auth service', async () => {
    const dto = {
      email: 'new@example.com',
      password: 'pw123',
      firstName: 'New',
      birthdate: '1995-01-01',
      gender: Gender.Woman,
    };
    const authResult = {
      access_token: 'token',
      user: {
        id: 'user-1',
        email: 'new@example.com',
        firstName: 'New',
        isOnboarded: false,
      },
    };
    authServiceMock.signup.mockResolvedValue(authResult);

    await expect(controller.signup(dto)).resolves.toEqual(authResult);
    expectSchema(AuthResponseSchema, authResult);
    expect(authServiceMock.signup).toHaveBeenCalledWith(dto);
  });

  it('delegates getProfile to auth service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    const currentUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      birthdate: null,
      gender: 'FEMALE',
      showMeMen: true,
      showMeWomen: true,
      pronouns: null,
      isOnboarded: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
      age: 30,
      profile: null,
      fitnessProfile: null,
      photos: [],
    };
    authServiceMock.getCurrentUser.mockResolvedValue(currentUser);

    await expect(controller.getProfile(req)).resolves.toEqual(currentUser);
    expectSchema(CurrentUserSchema, currentUser);
    expect(authServiceMock.getCurrentUser).toHaveBeenCalledWith('user-1');
  });

  it('propagates service errors to the caller', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    await expect(
      controller.login({ email: 'bad@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('propagates signup conflict errors to the caller', async () => {
    authServiceMock.signup.mockRejectedValue(
      new BadRequestException('Unable to create account'),
    );

    await expect(
      controller.signup({
        email: 'dup@example.com',
        password: 'pw',
        firstName: 'Dup',
        birthdate: '1995-01-01',
        gender: Gender.Man,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registers a push token for the authenticated user', async () => {
    authServiceMock.registerPushToken.mockResolvedValue(undefined);
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

    await expect(
      controller.registerPushToken(req, { token: 'ExponentPushToken[abc]' }),
    ).resolves.toBeUndefined();

    expect(authServiceMock.registerPushToken).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[abc]',
    );
  });
});
