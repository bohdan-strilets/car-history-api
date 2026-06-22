import { UserResponseDto } from '@modules/users';

export class AuthResponseDto {
  declare accessToken: string;
  declare user: UserResponseDto;
}
