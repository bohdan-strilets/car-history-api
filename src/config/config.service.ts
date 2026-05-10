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
}
