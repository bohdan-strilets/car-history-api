import { IsDateString, IsInt, Min } from 'class-validator';

export class MarkMaintenanceDoneDto {
  @IsInt()
  @Min(0)
  declare mileage: number;

  @IsDateString()
  declare date: string;
}
