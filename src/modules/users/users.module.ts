import { CryptoModule } from '@common/crypto';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { AppModule } from '../../app.module';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AppModule, CryptoModule],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
