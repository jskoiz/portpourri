import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { LoginDto } from './auth.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { Gender } from '../common/enums';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    signup: jest.fn(),
    getCurrentUser: jest.fn(),
    deleteAccount: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates login to auth service', async () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'pw' };
    authServiceMock.login.mockResolvedValue({ access_token: 'token' });

    await expect(controller.login(dto)).resolves.toEqual({
      access_token: 'token',
    });
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
    authServiceMock.signup.mockResolvedValue({
      access_token: 'token',
      user: { id: 'user-1', email: 'new@example.com', isOnboarded: false },
    });

    await expect(controller.signup(dto)).resolves.toEqual({
      access_token: 'token',
      user: { id: 'user-1', email: 'new@example.com', isOnboarded: false },
    });
    expect(authServiceMock.signup).toHaveBeenCalledWith(dto);
  });

  it('delegates getProfile to auth service', async () => {
    const req = { user: { id: 'user-1' } } as AuthenticatedRequest;
    authServiceMock.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    await expect(controller.getProfile(req)).resolves.toEqual({
      id: 'user-1',
      email: 'test@example.com',
    });
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
});
