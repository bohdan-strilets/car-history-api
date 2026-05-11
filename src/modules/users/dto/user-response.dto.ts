import { UserStatus } from '@prisma/client';

export class UserResponseDto {
  declare id: string;
  declare email: string;
  declare emailVerified: boolean;
  declare firstName: string;
  declare lastName: string;
  declare avatarUrl: string | null;
  declare status: UserStatus;
  declare createdAt: Date;
}
