describe('appConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  const loadConfig = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./app.config').appConfig;
  };

  describe('JWT_SECRET', () => {
    it('throws when JWT_SECRET is missing in non-test environments', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'development';
      // DATABASE_URL must be present so we don't fail on that first
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

      expect(() => loadConfig()).toThrow(
        'JWT_SECRET environment variable is required',
      );
    });

    it('uses a test fallback when NODE_ENV is test', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'test';

      const config = loadConfig();
      expect(config.jwt.secret).toBe('test-jwt-secret');
    });

    it('uses the env var when JWT_SECRET is provided', () => {
      process.env.JWT_SECRET = 'my-super-secret';
      process.env.NODE_ENV = 'test';

      const config = loadConfig();
      expect(config.jwt.secret).toBe('my-super-secret');
    });
  });

  describe('DATABASE_URL', () => {
    it('throws when DATABASE_URL is missing in non-test environments', () => {
      process.env.JWT_SECRET = 'test-secret';
      delete process.env.DATABASE_URL;
      process.env.NODE_ENV = 'development';

      expect(() => loadConfig()).toThrow(
        'DATABASE_URL environment variable is required',
      );
    });

    it('uses a test fallback when NODE_ENV is test', () => {
      delete process.env.DATABASE_URL;
      process.env.NODE_ENV = 'test';

      const config = loadConfig();
      expect(config.database.url).toContain('postgresql://');
    });

    it('uses the env var when DATABASE_URL is provided', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://prod:pw@db:5432/brdg';
      process.env.NODE_ENV = 'test';

      const config = loadConfig();
      expect(config.database.url).toBe(
        'postgresql://prod:pw@db:5432/brdg',
      );
    });
  });

  describe('ALLOWED_ORIGINS', () => {
    it('throws in production when ALLOWED_ORIGINS is not set', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOWED_ORIGINS;

      expect(() => loadConfig()).toThrow(
        'ALLOWED_ORIGINS environment variable is required in production',
      );
    });

    it('defaults to localhost origins in development', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NODE_ENV = 'development';
      delete process.env.ALLOWED_ORIGINS;

      const config = loadConfig();
      expect(config.cors.allowedOrigins).toEqual([
        'http://localhost:3000',
        'http://localhost:8081',
      ]);
    });

    it('parses comma-separated ALLOWED_ORIGINS', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS =
        'https://app.example.com, https://admin.example.com';

      const config = loadConfig();
      expect(config.cors.allowedOrigins).toEqual([
        'https://app.example.com',
        'https://admin.example.com',
      ]);
    });
  });

  describe('build provenance', () => {
    it('defaults build metadata when image build args are missing', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NODE_ENV = 'test';
      delete process.env.BUILD_GIT_SHA;
      delete process.env.BUILD_IMAGE_TAG;
      delete process.env.BUILD_TIME;
      delete process.env.BUILD_SOURCE;

      const config = loadConfig();
      expect(config.build).toMatchObject({
        environment: 'test',
        gitSha: 'unknown',
        gitShortSha: 'unknown',
        imageTag: 'unknown',
        buildTime: 'unknown',
        source: 'local',
      });
    });

    it('reads build metadata from env vars', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://brdg.social';
      process.env.BUILD_GIT_SHA = 'abcdef1234567890';
      process.env.BUILD_IMAGE_TAG = 'ghcr.io/jskoiz/brdg-api:abcdef1234567890';
      process.env.BUILD_TIME = '2026-03-23T16:00:00.000Z';
      process.env.BUILD_SOURCE =
        'https://github.com/jskoiz/brdg/actions/runs/123456789';

      const config = loadConfig();
      expect(config.build).toMatchObject({
        environment: 'production',
        gitSha: 'abcdef1234567890',
        gitShortSha: 'abcdef1',
        imageTag: 'ghcr.io/jskoiz/brdg-api:abcdef1234567890',
        buildTime: '2026-03-23T16:00:00.000Z',
        source: 'https://github.com/jskoiz/brdg/actions/runs/123456789',
      });
    });
  });
});
