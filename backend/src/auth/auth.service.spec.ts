import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
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

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({ email: 'test@example.com', sub: 'user-1' });
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        isOnboarded: true,
      },
    });
  });
});
