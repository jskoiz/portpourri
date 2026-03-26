import { withErrorLogging } from '../shared';
import * as observability from '../../../api/observability';

jest.mock('../../../api/observability', () => ({
  logApiFailure: jest.fn(),
}));

const mockLogApiFailure = observability.logApiFailure as jest.Mock;

describe('withErrorLogging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the underlying value on success', async () => {
    await expect(
      withErrorLogging('auth', 'login', async () => ({ ok: true })),
    ).resolves.toEqual({ ok: true });

    expect(mockLogApiFailure).not.toHaveBeenCalled();
  });

  it('logs failures and rethrows errors', async () => {
    const error = new Error('boom');

    await expect(
      withErrorLogging('profile', 'updateProfile', async () => {
        throw error;
      }),
    ).rejects.toThrow('boom');

    expect(mockLogApiFailure).toHaveBeenCalledWith(
      'profile',
      'updateProfile',
      error,
      undefined,
    );
  });
});
