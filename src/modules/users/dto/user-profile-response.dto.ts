import { UserResponseDto } from './user-response.dto';
import { UserSettingsResponseDto } from './user-settings-response.dto';

export class UserProfileResponseDto extends UserResponseDto {
  declare settings: UserSettingsResponseDto;
}
