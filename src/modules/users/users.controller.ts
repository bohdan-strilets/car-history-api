import { Auth, CurrentUserId } from '@common/decorators';
import { Controller, Get } from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('users')
@Auth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }
}
