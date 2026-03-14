const env = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3010',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/brdg_db',
};

module.exports = { env };
