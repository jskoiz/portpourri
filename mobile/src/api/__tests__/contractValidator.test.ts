import type { AxiosResponse } from 'axios';
import { devContractInterceptor } from '../contractValidator';

const globalWithDev = global as typeof globalThis & { __DEV__?: boolean };

function makeResponse(data: unknown, config: Partial<AxiosResponse['config']> = {}) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      method: 'get',
      baseURL: 'https://api.example.test',
      url: '/profile',
      ...config,
    },
    request: {},
  } as AxiosResponse;
}

describe('devContractInterceptor', () => {
  const originalWarn = console.warn;
  let warnSpy: jest.Mock;

  beforeEach(() => {
    globalWithDev.__DEV__ = true;
    warnSpy = jest.fn();
    console.warn = warnSpy;
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  it('accepts current user responses when the request URL includes a query string', () => {
    const response = makeResponse(
      {
        id: 'user-1',
        email: 'lana@brdg.local',
        firstName: 'Lana',
        birthdate: '1996-03-12T00:00:00.000Z',
        gender: 'female',
        showMeMen: true,
        showMeWomen: true,
        pronouns: 'she/her',
        isOnboarded: true,
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T01:00:00.000Z',
        age: 29,
        profile: null,
        fitnessProfile: null,
        photos: [
          {
            id: 'photo-1',
            storageKey: 'https://cdn.example.test/photo-1.jpg',
            isPrimary: true,
            isHidden: false,
            sortOrder: 0,
            createdAt: '2026-03-25T00:00:00.000Z',
          },
        ],
      },
      { url: 'https://api.example.test/profile?include=photos' },
    );

    expect(devContractInterceptor(response)).toBe(response);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('accepts moderation block responses with the backend shape', () => {
    const response = makeResponse(
      { success: true, matchId: 'match-1' },
      { method: 'post', url: '/moderation/block?from=profile' },
    );

    expect(devContractInterceptor(response)).toBe(response);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns when a current user photo is missing the mobile-only metadata', () => {
    const response = makeResponse(
      {
        id: 'user-1',
        email: 'lana@brdg.local',
        firstName: 'Lana',
        birthdate: '1996-03-12T00:00:00.000Z',
        gender: 'female',
        showMeMen: true,
        showMeWomen: true,
        pronouns: 'she/her',
        isOnboarded: true,
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T01:00:00.000Z',
        age: 29,
        profile: null,
        fitnessProfile: null,
        photos: [
          {
            id: 'photo-1',
            storageKey: 'https://cdn.example.test/photo-1.jpg',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      { url: 'https://api.example.test/profile?include=photos' },
    );

    expect(devContractInterceptor(response)).toBe(response);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[contract] GET /profile response shape mismatch:'),
    );
  });
});
