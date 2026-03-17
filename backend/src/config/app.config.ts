const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isTest = process.env.NODE_ENV === 'test';

const apiPort = toNumber(process.env.PORT, 3000);
const localApiBaseUrl = `http://127.0.0.1:${apiPort}`;
const apiBaseUrl = process.env.API_BASE_URL || localApiBaseUrl;
const assetBaseUrl = process.env.BASE_URL || apiBaseUrl;
const allowedOrigins = (() => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ALLOWED_ORIGINS environment variable is required in production. ' +
        'Set a comma-separated list of allowed origins (e.g. https://app.example.com).',
    );
  }
  return ['http://localhost:3000', 'http://localhost:8081'];
})();

const jwtSecret = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (isTest) return 'test-jwt-secret';
  throw new Error(
    'JWT_SECRET environment variable is required in non-test environments. ' +
      'Set a strong, random secret (e.g. 64+ hex chars) before starting the server.',
  );
})();

const databaseUrl = (() => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (isTest) return 'postgresql://test:test@localhost:5432/test';
  throw new Error(
    'DATABASE_URL environment variable is required in non-test environments. ' +
      'Set a valid PostgreSQL connection string before starting the server.',
  );
})();

const isProduction = process.env.NODE_ENV === 'production';
const databaseConnectionLimit = toNumber(
  process.env.DATABASE_CONNECTION_LIMIT,
  10,
);
const databaseConnectionTimeout = toNumber(
  process.env.DATABASE_CONNECTION_TIMEOUT,
  10,
);

export const appConfig = {
  apiPort,
  cors: {
    allowedOrigins,
  },
  database: {
    connectionLimit: databaseConnectionLimit,
    connectionTimeout: databaseConnectionTimeout,
    url: databaseUrl,
  },
  isProduction,
  docs: {
    swaggerEnabled: process.env.NODE_ENV !== 'production',
  },
  auth: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: '60m' as const,
  },
  seed: {
    assetBaseUrl,
  },
  uploads: {
    profileDir: 'public/uploads/profile',
    profilePublicBaseUrl: `${assetBaseUrl}/uploads/profile`,
  },
  scripts: {
    apiBaseUrl,
  },
};
