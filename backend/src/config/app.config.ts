const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const apiPort = toNumber(process.env.PORT, 3000);
const localApiBaseUrl = `http://127.0.0.1:${apiPort}`;
const apiBaseUrl = process.env.API_BASE_URL || localApiBaseUrl;
const assetBaseUrl = process.env.BASE_URL || apiBaseUrl;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) || ['http://localhost:3000'];

if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  console.warn(
    '[CORS] WARNING: ALLOWED_ORIGINS not set in production. Defaulting to localhost — this may block all client requests.',
  );
}

const jwtSecret = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'test') return 'test-jwt-secret';
  throw new Error(
    'JWT_SECRET environment variable is required in non-test environments. ' +
      'Set a strong, random secret (e.g. 64+ hex chars) before starting the server.',
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
    url: process.env.DATABASE_URL,
  },
  isProduction,
  docs: {
    swaggerEnabled: process.env.NODE_ENV !== 'production',
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
