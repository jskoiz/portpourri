describe('env', () => {
  const env = process['env'] as NodeJS.ProcessEnv;
  const originalEnv = {
    EXPO_PUBLIC_API_URL: env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_DEV_LAN_API_URL: env.EXPO_PUBLIC_DEV_LAN_API_URL,
  };

  beforeEach(() => {
    delete env.EXPO_PUBLIC_API_URL;
    delete env.EXPO_PUBLIC_DEV_LAN_API_URL;
    jest.resetModules();
  });

  afterAll(() => {
    if (originalEnv.EXPO_PUBLIC_API_URL === undefined) {
      delete env.EXPO_PUBLIC_API_URL;
    } else {
      env.EXPO_PUBLIC_API_URL = originalEnv.EXPO_PUBLIC_API_URL;
    }

    if (originalEnv.EXPO_PUBLIC_DEV_LAN_API_URL === undefined) {
      delete env.EXPO_PUBLIC_DEV_LAN_API_URL;
    } else {
      env.EXPO_PUBLIC_DEV_LAN_API_URL = originalEnv.EXPO_PUBLIC_DEV_LAN_API_URL;
    }
  });

  it('falls back to the iOS simulator URL when Platform.select is unavailable', () => {
    jest.doMock('react-native', () => ({
      Platform: undefined,
    }));

    jest.isolateModules(() => {
      const { env } = require('../env');

      expect(env.apiUrl).toBe('http://127.0.0.1:3010');
    });
  });
});
