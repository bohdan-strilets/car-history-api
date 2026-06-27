import { Auth, CurrentUserId, EmailVerified } from '@common/decorators';
import { Body, Controller, Get, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UpdateUserDto, UpdateUserSettingsDto } from './dto';
import { UploadedFile as UploadedFileType } from './types';
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

  @Post('me/avatar')
  @EmailVerified()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@CurrentUserId() userId: string, @UploadedFile() file: UploadedFileType) {
    return this.usersService.uploadAvatar(userId, file);
  }
}
