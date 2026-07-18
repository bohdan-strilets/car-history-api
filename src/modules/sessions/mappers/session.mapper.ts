import { Session } from '@prisma/client';

import { SessionResponseDto } from '../dto';

export const toSessionResponse = (
  session: Session,
  currentSessionId: string,
): SessionResponseDto => {
  return {
    id: session.id,
    deviceName: session.deviceName,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    isCurrent: session.id === currentSessionId,
  };
};

export const toSessionListResponse = (
  sessions: Session[],
  currentSessionId: string,
): SessionResponseDto[] => {
  return sessions.map((session) => toSessionResponse(session, currentSessionId));
};
