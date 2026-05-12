import { JwtAccessPayload } from '@modules/tokens/jwt.types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}
