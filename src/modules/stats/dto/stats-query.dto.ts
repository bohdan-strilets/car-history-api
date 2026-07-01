import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum StatsPeriod {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  ALL = 'all',
}

export class StatsQueryDto {
  @IsOptional()
  @IsEnum(StatsPeriod)
  period: StatsPeriod = StatsPeriod.MONTH;

  @IsOptional()
  @IsDateString()
  date?: string;
}
