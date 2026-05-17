import { Auth, CurrentUserId, EmailVerified } from '@common/decorators';
import { Body, Controller, Get, Patch } from '@nestjs/common';

import { UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@Auth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @EmailVerified()
  async updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Patch('me/onboarding')
  @EmailVerified()
  async completeOnboarding(@CurrentUserId() userId: string) {
    return this.usersService.completeOnboarding(userId);
  }
}
