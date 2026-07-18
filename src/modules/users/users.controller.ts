import { Auth, CurrentSessionId, CurrentUserId, EmailVerified, Public } from '@common/decorators';
import { SessionsService } from '@modules/sessions';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

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
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

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

  @Get('me/sessions')
  async getSessions(@CurrentUserId() userId: string, @CurrentSessionId() currentSessionId: string) {
    return this.sessionsService.getUserSessions(userId, currentSessionId);
  }

  @Delete('me/sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUserId() userId: string,
    @Param('id') sessionId: string,
  ): Promise<void> {
    await this.sessionsService.revokeSession(sessionId, userId);
  }

  @Delete('me/sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessionsExceptCurrent(
    @CurrentUserId() userId: string,
    @CurrentSessionId() currentSessionId: string,
  ): Promise<void> {
    await this.sessionsService.revokeAllSessionsExceptCurrent(userId, currentSessionId);
  }
}
