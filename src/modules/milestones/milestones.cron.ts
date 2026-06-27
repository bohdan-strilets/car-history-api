import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MilestonesService } from './milestones.service';

@Injectable()
export class MilestonesCron {
  private readonly logger = new Logger(MilestonesCron.name);

  constructor(private readonly milestonesService: MilestonesService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleOwnershipMilestones(): Promise<void> {
    this.logger.log('⏰ Running ownership milestones cron...');

    try {
      await this.milestonesService.checkOwnershipMilestones();
      this.logger.log('✅ Ownership milestones cron completed');
    } catch (error) {
      this.logger.error(
        `❌ Ownership milestones cron failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
