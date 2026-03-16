import type { ChatMessage } from '../../../api/types';

export function makeChatMessage(
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: overrides.id ?? 'message-1',
    text: overrides.text ?? 'Want to plan something active together this week?',
    sender: overrides.sender ?? 'them',
    timestamp: overrides.timestamp ?? '2026-03-15T08:30:00.000Z',
  };
}
