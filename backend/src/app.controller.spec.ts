import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET /', () => {
    it('should return { status: "ok" }', () => {
      expect(appController.getLiveness()).toEqual({ status: 'ok' });
    });
  });

  describe('GET /health', () => {
    it('should return ok when DB is reachable', async () => {
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status } as any;

      await appController.getHealth(res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ok', timestamp: expect.any(String) }),
      );
    });

    it('should return 503 when DB is unreachable', async () => {
      prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));

      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status } as any;

      await appController.getHealth(res);

      expect(status).toHaveBeenCalledWith(503);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: 'Database connection failed',
        }),
      );
    });
  });
});
