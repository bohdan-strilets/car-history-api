import { WorkspaceMember } from '@common/decorators';
import { Controller, Get, Param } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto';

@Controller('workspaces/:workspaceId/dashboard')
@WorkspaceMember()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Param('workspaceId') workspaceId: string): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard(workspaceId);
  }
}
