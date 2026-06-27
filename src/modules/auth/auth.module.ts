// src/modules/auth/auth.module.ts

import { AuditLogService } from '@common/audit';
import { AuthCsrfGuard, AuthRateLimitGuard, JwtAuthGuard } from '@common/guards';
import { AppConfigModule } from '@config/config.module';
import { MailModule } from '@modules/mail';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, UsersModule, SessionsModule, AppConfigModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    GoogleStrategy,
    AuthRateLimitGuard,
    AuthCsrfGuard,
    AuditLogService,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
