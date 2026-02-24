import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    signup: jest.fn(),
    getCurrentUser: jest.fn(),
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
    const dto = { email: 'test@example.com', password: 'pw' };
    authServiceMock.login.mockResolvedValue({ access_token: 'token' });

    await expect(controller.login(dto)).resolves.toEqual({ access_token: 'token' });
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });
});
