import { IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  declare token: string;
}
