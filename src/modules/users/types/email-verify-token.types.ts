export interface CreateEmailVerifyTokenInput {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}
