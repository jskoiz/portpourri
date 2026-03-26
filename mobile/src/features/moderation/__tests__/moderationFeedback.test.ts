import { getModerationFailureAlert, getModerationSuccessAlert } from '../moderationFeedback';
import { normalizeApiError } from '../../../api/errors';

jest.mock('../../../api/errors', () => ({
  normalizeApiError: jest.fn(),
}));

const mockNormalizeApiError = jest.mocked(normalizeApiError);

describe('moderationFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the expected success copy', () => {
    expect(getModerationSuccessAlert('block')).toEqual({
      title: 'User blocked',
      message: 'They will no longer be able to see your profile or message you.',
    });
    expect(getModerationSuccessAlert('report')).toEqual({
      title: 'Report submitted',
      message: 'Thank you for helping keep BRDG safe. We will review this report.',
    });
  });

  it('returns clearer copy when a user is already blocked', () => {
    mockNormalizeApiError.mockReturnValue({
      message: 'User already blocked',
      kind: 'unknown',
      isNetworkError: false,
      isUnauthorized: false,
      retryable: false,
      transient: false,
      transport: 'http' as const,
      fingerprint: 'test',
    });

    expect(getModerationFailureAlert('block', new Error('ignored'))).toEqual({
      title: 'User already blocked',
      message: 'This user is already blocked.',
    });
  });

  it('returns unavailable copy when the target profile is missing', () => {
    mockNormalizeApiError.mockReturnValue({
      message: 'Not found',
      kind: 'not_found',
      isNetworkError: false,
      isUnauthorized: false,
      retryable: false,
      transient: false,
      transport: 'http' as const,
      fingerprint: 'test',
    });

    expect(getModerationFailureAlert('report', new Error('ignored'))).toEqual({
      title: 'Could not submit report',
      message: 'This profile is no longer available. Refresh and try again.',
    });
  });
});
