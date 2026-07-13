import { IsString } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  declare password: string;
}
