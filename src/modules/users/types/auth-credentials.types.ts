export interface CreateCredentialsInput {
  userId: string;
  passwordHash?: string;
}

export interface UpdatePasswordInput {
  passwordHash: string;
  passwordChangedAt: Date;
}

export interface IncrementFailedAttemptsInput {
  lockedUntil?: Date;
}
