export interface CreateEmailChangeTokenInput {
  userId: string;
  newEmail: string;
  tokenHash: string;
  expiresAt: Date;
}
