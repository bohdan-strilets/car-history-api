import { JwtAccessPayload } from '@modules/tokens/jwt.types';
import { WorkspaceMember } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
      workspaceMember?: WorkspaceMember;
    }
  }
}
