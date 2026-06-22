import { HttpExceptionFilter } from '@common/exceptions';
import { TransformInterceptor } from '@common/interceptors';
import { createValidationPipe } from '@common/pipes';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfigService } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  const logger = new Logger('Bootstrap');

  const port = config.port;
  const frontendUrl = config.frontendUrl;
  const prefix = config.prefix;

  app.use(helmet());
  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(createValidationPipe());

  app.use(cookieParser());

  await app.listen(port);
  logger.log(`🚀 Arvino API running on http://localhost:${port}/${prefix}`);
}

bootstrap();
