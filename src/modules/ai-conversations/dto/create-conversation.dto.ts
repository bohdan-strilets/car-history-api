import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  declare vehicleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare title?: string;
}
