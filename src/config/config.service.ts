import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv() {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port() {
    return this.config.get('PORT', { infer: true });
  }

  get prefix() {
    return this.config.get('PREFIX', { infer: true });
  }

  get databaseUrl() {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get frontendUrl() {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  get siteName() {
    return this.config.get('SITE_NAME', { infer: true });
  }

  get databasePoolMax() {
    return this.config.get('DATABASE_POOL_MAX', { infer: true });
  }

  get databasePoolIdleTimeoutMs() {
    return this.config.get('DATABASE_POOL_IDLE_TIMEOUT_MS', { infer: true });
  }

  get databasePoolConnectionTimeoutMs() {
    return this.config.get('DATABASE_POOL_CONNECTION_TIMEOUT_MS', { infer: true });
  }

  get isDevelopment() {
    return this.nodeEnv === 'development';
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get bcryptRounds() {
    return this.config.get('BCRYPT_ROUNDS', { infer: true });
  }

  get tokenBytes() {
    return this.config.get('TOKEN_BYTES', { infer: true });
  }

  get jwtAccessSecret() {
    return this.config.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get jwtRefreshSecret() {
    return this.config.get('JWT_REFRESH_SECRET', { infer: true });
  }

  get jwtAccessPreviousSecrets() {
    const value = this.config.get('JWT_ACCESS_PREVIOUS_SECRETS', { infer: true });
    return value
      .split(',')
      .map((secret) => secret.trim())
      .filter(Boolean);
  }

  get jwtRefreshPreviousSecrets() {
    const value = this.config.get('JWT_REFRESH_PREVIOUS_SECRETS', { infer: true });
    return value
      .split(',')
      .map((secret) => secret.trim())
      .filter(Boolean);
  }

  get jwtAccessExpiresIn() {
    return this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
  }

  get jwtRefreshExpiresIn() {
    return this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
  }

  get jwtIssuer() {
    return this.config.get('JWT_ISSUER', { infer: true });
  }

  get jwtAudience() {
    return this.config.get('JWT_AUDIENCE', { infer: true });
  }

  get maxFailedAttempts() {
    return this.config.get('MAX_FAILED_ATTEMPTS', { infer: true });
  }

  get lockDurationMinutes() {
    return this.config.get('LOCK_DURATION_MINUTES', { infer: true });
  }

  get googleClientId() {
    return this.config.get('GOOGLE_CLIENT_ID', { infer: true });
  }

  get googleClientSecret() {
    return this.config.get('GOOGLE_CLIENT_SECRET', { infer: true });
  }

  get googleCallbackUrl() {
    return this.config.get('GOOGLE_CALLBACK_URL', { infer: true });
  }

  get googlePlacesApiKey() {
    return this.config.get('GOOGLE_PLACES_API_KEY', { infer: true });
  }

  get resendApiKey() {
    return this.config.get('RESEND_API_KEY', { infer: true });
  }

  get mailFrom() {
    return this.config.get('MAIL_FROM', { infer: true });
  }

  get passwordResetExpiresInMinutes() {
    return this.config.get('PASSWORD_RESET_EXPIRES_IN_MINUTES', { infer: true });
  }

  get emailVerifyExpiresInMinutes() {
    return this.config.get('EMAIL_VERIFY_EXPIRES_IN_MINUTES', { infer: true });
  }

  get openRouterApiKey() {
    return this.config.get('OPENROUTER_API_KEY', { infer: true });
  }

  get openRouterBaseUrl() {
    return this.config.get('OPENROUTER_BASE_URL', { infer: true });
  }

  get openRouterDefaultModel() {
    return this.config.get('OPENROUTER_DEFAULT_MODEL', { infer: true });
  }

  get openRouterMaxTokens() {
    return this.config.get('OPENROUTER_MAX_TOKENS', { infer: true });
  }

  get corsAllowedOrigins() {
    return this.config
      .get('CORS_ALLOWED_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get corsAllowedMethods() {
    return this.config
      .get('CORS_ALLOWED_METHODS', { infer: true })
      .split(',')
      .map((method) => method.trim().toUpperCase())
      .filter(Boolean);
  }

  get corsAllowedHeaders() {
    return this.config
      .get('CORS_ALLOWED_HEADERS', { infer: true })
      .split(',')
      .map((header) => header.trim())
      .filter(Boolean);
  }

  get enableAntivirusScan() {
    return this.config.get('ENABLE_ANTIVIRUS_SCAN', { infer: true });
  }

  get cloudinaryCloudName() {
    return this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
  }

  get cloudinaryApiKey() {
    return this.config.get('CLOUDINARY_API_KEY', { infer: true });
  }

  get cloudinaryApiSecret() {
    return this.config.get('CLOUDINARY_API_SECRET', { infer: true });
  }

  get mediaMaxFileSizeMb() {
    return this.config.get('MEDIA_MAX_FILE_SIZE_MB', { infer: true });
  }

  get mediaAllowedImageMimeTypes() {
    return this.config
      .get('MEDIA_ALLOWED_IMAGE_MIME_TYPES', { infer: true })
      .split(',')
      .map((mimeType) => mimeType.trim().toLowerCase())
      .filter(Boolean);
  }

  get mediaAllowedVideoMimeTypes() {
    return this.config
      .get('MEDIA_ALLOWED_VIDEO_MIME_TYPES', { infer: true })
      .split(',')
      .map((mimeType) => mimeType.trim().toLowerCase())
      .filter(Boolean);
  }

  get mediaMaxVideoDurationSeconds() {
    return this.config.get('MEDIA_MAX_VIDEO_DURATION_SECONDS', { infer: true });
  }
}
