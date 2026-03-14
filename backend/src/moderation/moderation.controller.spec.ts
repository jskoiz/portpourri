import { Test, TestingModule } from '@nestjs/testing';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

describe('ModerationController', () => {
  let controller: ModerationController;

  const moderationServiceMock = {
    reportUser: jest.fn(),
    blockUser: jest.fn(),
  };

  const req = { user: { id: 'user-1' } } as AuthenticatedRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [{ provide: ModerationService, useValue: moderationServiceMock }],
    }).compile();

    controller = module.get<ModerationController>(ModerationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates report to moderation service', async () => {
    const report = { id: 'report-1', status: 'open' };
    moderationServiceMock.reportUser.mockResolvedValue(report);

    const body = { reportedUserId: 'user-2', category: 'spam', description: 'test' };
    const result = await controller.report(req, body);

    expect(moderationServiceMock.reportUser).toHaveBeenCalledWith('user-1', body);
    expect(result).toBe(report);
  });

  it('delegates block to moderation service', async () => {
    const blockResult = { success: true, matchId: 'match-1' };
    moderationServiceMock.blockUser.mockResolvedValue(blockResult);

    const result = await controller.block(req, { targetUserId: 'user-2' });

    expect(moderationServiceMock.blockUser).toHaveBeenCalledWith('user-1', 'user-2');
    expect(result).toBe(blockResult);
  });
});
