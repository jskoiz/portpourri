import { normalizeApiError } from '../../api/errors';

export type ModerationAction = 'block' | 'report';

export interface ModerationAlertContent {
  title: string;
  message: string;
}

function getActionLabel(action: ModerationAction) {
  return action === 'block' ? 'block user' : 'submit report';
}

function getSuccessTitle(action: ModerationAction) {
  return action === 'block' ? 'User blocked' : 'Report submitted';
}

function getSuccessMessage(action: ModerationAction) {
  return action === 'block'
    ? 'They will no longer be able to see your profile or message you.'
    : 'Thank you for helping keep BRDG safe. We will review this report.';
}

export function getModerationSuccessAlert(
  action: ModerationAction,
): ModerationAlertContent {
  return {
    title: getSuccessTitle(action),
    message: getSuccessMessage(action),
  };
}

export function getModerationFailureAlert(
  action: ModerationAction,
  error: unknown,
): ModerationAlertContent {
  const normalized = normalizeApiError(error);
  const lowerMessage = normalized.message.toLowerCase();
  const actionLabel = getActionLabel(action);
  const baseTitle =
    action === 'block' ? 'Could not block user' : 'Could not submit report';

  if (
    normalized.code === 'already_blocked' ||
    normalized.code === 'already_reported' ||
    /already (?:been )?(blocked|reported)/.test(lowerMessage)
  ) {
    return {
      title:
        action === 'block' ? 'User already blocked' : 'Report already submitted',
      message:
        action === 'block'
          ? 'This user is already blocked.'
          : 'This report has already been submitted.',
    };
  }

  if (
    normalized.kind === 'not_found' ||
    lowerMessage.includes('no longer available') ||
    lowerMessage.includes('not found')
  ) {
    return {
      title: baseTitle,
      message: 'This profile is no longer available. Refresh and try again.',
    };
  }

  if (normalized.kind === 'forbidden') {
    return {
      title: baseTitle,
      message:
        action === 'block'
          ? 'You cannot block this user right now.'
          : 'You cannot submit this report right now.',
    };
  }

  if (normalized.kind === 'unauthorized') {
    return {
      title: baseTitle,
      message: 'Please sign in again and try once more.',
    };
  }

  if (normalized.kind === 'rate_limited') {
    return {
      title: baseTitle,
      message: 'You are doing that too quickly. Please wait a moment and try again.',
    };
  }

  if (normalized.kind === 'service_unavailable' || normalized.kind === 'server_error') {
    return {
      title: baseTitle,
      message: 'Service is temporarily unavailable. Please try again shortly.',
    };
  }

  if (normalized.kind === 'network' || normalized.isNetworkError) {
    return {
      title: baseTitle,
      message: 'Check your connection and try again.',
    };
  }

  return {
    title: baseTitle,
    message: normalized.message || `Could not ${actionLabel}. Please try again later.`,
  };
}
