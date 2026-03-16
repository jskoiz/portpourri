import type { Logger } from './types.js';

function emit(level: string, message: string, fields?: Record<string, unknown>): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(): Logger {
  return {
    debug(message, fields) {
      emit('debug', message, fields);
    },
    info(message, fields) {
      emit('info', message, fields);
    },
    warn(message, fields) {
      emit('warn', message, fields);
    },
    error(message, fields) {
      emit('error', message, fields);
    },
  };
}
