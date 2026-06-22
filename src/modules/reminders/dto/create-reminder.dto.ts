import { ReminderType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateReminderDto {
  @IsEnum(ReminderType)
  declare type: ReminderType;

  @IsString()
  declare title: string;

  @IsOptional()
  @IsString()
  declare description?: string;

  @IsOptional()
  @IsDateString()
  declare dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  declare dueMileage?: number;
}
