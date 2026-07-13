import { Auth, CurrentUserId, EmailVerified, Public } from '@common/decorators';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';

import {
  ChangeEmailDto,
  ConfirmEmailChangeDto,
  DeleteAccountDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
} from './dto';
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

  @Patch('me/settings')
  @EmailVerified()
  async updateSettings(@CurrentUserId() userId: string, @Body() dto: UpdateUserSettingsDto) {
    return this.usersService.updateSettings(userId, dto);
  }

  @Post('me/change-email')
  @EmailVerified()
  async changeEmail(@CurrentUserId() userId: string, @Body() dto: ChangeEmailDto) {
    await this.usersService.changeEmail(userId, dto);
  }

  @Post('me/confirm-email-change')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmailChange(@Body() dto: ConfirmEmailChangeDto) {
    await this.usersService.confirmEmailChange(dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUserId() userId: string,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    await this.usersService.deleteAccount(userId, dto.password);
  }

  @Patch('me/password')
  @EmailVerified()
  async changePassword(@CurrentUserId() userId: string, @Body() dto: UpdatePasswordDto) {
    await this.usersService.changePassword(userId, dto);
  }
}
