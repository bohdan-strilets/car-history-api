import { UserResponseDto } from '@modules/users';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}
