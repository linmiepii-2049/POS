type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const writeLog = (level: LogLevel, message: string, details?: Record<string, unknown>) => {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(details ? { details } : {}),
  };

  const serialized = JSON.stringify(payload);

  switch (level) {
    case 'error':
      console.error(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    default:
      console.log(serialized);
  }
};

export const logger = {
  info: (message: string, details?: Record<string, unknown>) => writeLog('info', message, details),
  warn: (message: string, details?: Record<string, unknown>) => writeLog('warn', message, details),
  error: (message: string, details?: Record<string, unknown>) => writeLog('error', message, details),
};



