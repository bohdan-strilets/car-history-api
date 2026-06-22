// Input

import { Session } from '@prisma/client';

export interface CreateSessionInput {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface UpdateSessionInput {
  refreshTokenHash: string;
  lastActivityAt: Date;
  expiresAt: Date;
}

// Options

export interface CreateSessionOptions {
  userId: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
}

// Result

export interface RefreshSessionResult {
  accessToken: string;
  refreshToken: string;
  session: Session;
}
