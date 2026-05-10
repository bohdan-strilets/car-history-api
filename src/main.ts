import { HttpExceptionFilter } from '@common/exceptions';
import { TransformInterceptor } from '@common/interceptors';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  logger.log(`🚀 Arvino API running on http://localhost:${port}/${prefix}`);
}

bootstrap();
