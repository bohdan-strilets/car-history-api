import { UserStatus } from '@prisma/client';

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
}

export interface UpdateStatusInput {
  status: UserStatus;
}
