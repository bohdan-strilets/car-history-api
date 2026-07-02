import { IsDateString, IsEnum, IsOptional } from 'class-validator';

import { StatsPeriod } from '../types';

export class StatsQueryDto {
  @IsOptional()
  @IsEnum(StatsPeriod)
  period: StatsPeriod = StatsPeriod.MONTH;

  @IsOptional()
  @IsDateString()
  date?: string;
}
