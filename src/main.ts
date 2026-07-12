import { HttpExceptionFilter } from '@common/exceptions';
import { TransformInterceptor } from '@common/interceptors';
import { createValidationPipe } from '@common/pipes';
import { Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfigService } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');
  const port = config.port;
  const prefix = config.prefix;
  const allowedOrigins = config.corsAllowedOrigins;

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: config.isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    }),
  );

  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: config.corsAllowedMethods,
    allowedHeaders: config.corsAllowedHeaders,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
  app.useGlobalPipes(createValidationPipe());
  app.use(cookieParser());

  await app.listen(port);
  logger.log(`🚀 Arvino API running on http://localhost:${port}/${prefix}`);
}

bootstrap();
