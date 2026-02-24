const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const requireEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

export const appConfig = {
  apiPort: toNumber(process.env.PORT, 3000),
  jwt: {
    secret: requireEnv(process.env.JWT_SECRET, 'JWT_SECRET'),
    expiresIn: '60m' as const,
  },
  seed: {
    assetBaseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  scripts: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },
};
