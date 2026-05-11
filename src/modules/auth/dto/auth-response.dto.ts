import { UserResponseDto } from '@modules/users';

export class AuthResponseDto {
  declare accessToken: string;
  declare refreshToken: string;
  declare user: UserResponseDto;
}
