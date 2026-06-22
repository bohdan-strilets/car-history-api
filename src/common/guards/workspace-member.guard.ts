import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const workspaceId = request.params?.workspaceId ?? request.params?.id;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
    });

    if (!workspace) {
      throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new ForbiddenException(ErrorCodes.Workspace.ACCESS_DENIED);
    }

    request.workspaceMember = member;

    return true;
  }
}
