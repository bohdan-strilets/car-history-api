import { createHash, randomBytes } from 'node:crypto';

import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { Token } from './crypto.types';

@Injectable()
export class CryptoService {
  constructor(private readonly config: AppConfigService) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.bcryptRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(): Token {
    const raw = randomBytes(this.config.tokenBytes).toString('hex');
    const hash = this.hashToken(raw);
    return { raw, hash };
  }

  hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  generateTokenFamily(): string {
    return randomBytes(16).toString('hex');
  }
}
