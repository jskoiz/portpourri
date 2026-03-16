import { Test, TestingModule } from '@nestjs/testing';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { VerificationChannel } from '../common/enums';

describe('VerificationController', () => {
  let controller: VerificationController;

  const verificationServiceMock = {
    status: jest.fn(),
    start: jest.fn(),
    confirm: jest.fn(),
  };

  const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [
        { provide: VerificationService, useValue: verificationServiceMock },
      ],
    }).compile();

    controller = module.get<VerificationController>(VerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates status to verification service', async () => {
    const statusResult = { hasVerifiedEmail: true, hasVerifiedPhone: false };
    verificationServiceMock.status.mockResolvedValue(statusResult);
    const result = await controller.status(req);
    expect(verificationServiceMock.status).toHaveBeenCalledWith('user-1');
    expect(result).toBe(statusResult);
  });

  it('delegates start to verification service', () => {
    const startResult = {
      started: true,
      channel: 'email',
      maskedTarget: 'a***@example.com',
    };
    verificationServiceMock.start.mockReturnValue(startResult);

    const result = controller.start(req, {
      channel: VerificationChannel.Email,
      target: 'alice@example.com',
    });

    expect(verificationServiceMock.start).toHaveBeenCalledWith(
      'user-1',
      'email',
      'alice@example.com',
    );
    expect(result).toBe(startResult);
  });

  it('delegates confirm to verification service', async () => {
    verificationServiceMock.confirm.mockResolvedValue({ verified: true });

    const result = await controller.confirm(req, {
      channel: VerificationChannel.Email,
      code: '123456',
    });

    expect(verificationServiceMock.confirm).toHaveBeenCalledWith(
      'user-1',
      'email',
      '123456',
    );
    expect(result).toEqual({ verified: true });
  });
});
