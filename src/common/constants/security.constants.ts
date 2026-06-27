import { TIME_UNITS } from './time.constants';

export const SECURITY = {
  CSRF_HEADER_NAME: 'x-csrf-token',
  AUTH_RATE_LIMITS: {
    LOGIN: {
      limit: 5,
      windowMs: TIME_UNITS.MILLISECONDS_PER_MINUTE,
      blockMs: 15 * TIME_UNITS.MILLISECONDS_PER_MINUTE,
      keyByEmail: true,
    },
    REFRESH: {
      limit: 10,
      windowMs: TIME_UNITS.MILLISECONDS_PER_MINUTE,
      blockMs: 10 * TIME_UNITS.MILLISECONDS_PER_MINUTE,
      keyByEmail: false,
    },
    PASSWORD_RESET: {
      limit: 5,
      windowMs: 5 * TIME_UNITS.MILLISECONDS_PER_MINUTE,
      blockMs: 15 * TIME_UNITS.MILLISECONDS_PER_MINUTE,
      keyByEmail: true,
    },
  },
  UPLOAD: {
    BLOCKED_EXTENSIONS: [
      '.exe',
      '.dll',
      '.bat',
      '.cmd',
      '.com',
      '.msi',
      '.sh',
      '.ps1',
      '.js',
      '.php',
      '.py',
      '.jar',
    ],
    EICAR_SIGNATURE: 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
  },
} as const;
