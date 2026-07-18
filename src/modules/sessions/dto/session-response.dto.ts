export class SessionResponseDto {
  declare id: string;
  declare deviceName: string | null;
  declare userAgent: string | null;
  declare ipAddress: string | null;
  declare lastActivityAt: Date | null;
  declare expiresAt: Date;
  declare createdAt: Date;
  declare isCurrent: boolean;
}
