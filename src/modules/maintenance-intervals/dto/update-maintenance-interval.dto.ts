import { PartialType } from '@nestjs/mapped-types';

import { CreateMaintenanceIntervalDto } from './create-maintenance-interval.dto';

export class UpdateMaintenanceIntervalDto extends PartialType(CreateMaintenanceIntervalDto) {}
