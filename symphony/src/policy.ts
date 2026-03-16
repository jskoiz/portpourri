import type { Logger } from './types.js';
import { UserInputRequiredError } from './errors.js';

export function buildCommandApprovalResponse(): { decision: 'accept' } {
  return { decision: 'accept' };
}

export function buildFileChangeApprovalResponse(): { decision: 'accept' } {
  return { decision: 'accept' };
}

export function buildPermissionsApprovalResponse(): {
  permissions: Record<string, never>;
  scope: 'turn';
} {
  return {
    permissions: {},
    scope: 'turn',
  };
}

export function throwOnInteractiveRequest(method: string, logger: Logger): never {
  logger.error('agent.user_input_required', { method });
  throw new UserInputRequiredError(`Codex requested interactive input via ${method}.`);
}
