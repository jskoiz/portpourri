import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule, Logger, PinoLogger } from 'nestjs-pino';

describe('Logger module (pino)', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: 'silent', // suppress output during tests
          },
        }),
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should provide the nestjs-pino Logger', () => {
    const logger = module.get(Logger);
    expect(logger).toBeDefined();
  });

  it('should resolve PinoLogger (request-scoped)', async () => {
    const pinoLogger = await module.resolve(PinoLogger);
    expect(pinoLogger).toBeDefined();
  });

  it('Logger should have standard logging methods', () => {
    const logger = module.get(Logger);
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });
});
