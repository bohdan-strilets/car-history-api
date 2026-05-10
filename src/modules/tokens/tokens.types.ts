export interface JwtAccessPayload {
  sub: string;
  sessionId: string;
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  tokenFamily: string;
}
