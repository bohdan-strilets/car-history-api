import { IsString } from 'class-validator';

export class ConfirmEmailChangeDto {
  @IsString()
  declare token: string;
}
