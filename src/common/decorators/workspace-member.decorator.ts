import { WorkspaceMemberGuard } from '@common/guards';
import { applyDecorators, UseGuards } from '@nestjs/common';

export const WorkspaceMember = () => applyDecorators(UseGuards(WorkspaceMemberGuard));
