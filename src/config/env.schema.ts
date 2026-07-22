import { StringValue } from 'ms';
import z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  PREFIX: z.string().default('api'),

  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SITE_NAME: z.string().default('Arvino'),

  THROTTLE_TTL_MS: z.coerce.number().int().min(1000).default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().min(1).default(100),

  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(20),
  DATABASE_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().default(30000),
  DATABASE_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().default(10000),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  TOKEN_BYTES: z.coerce.number().int().min(32).max(64).default(32),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_PREVIOUS_SECRETS: z.string().optional().default(''),
  JWT_REFRESH_PREVIOUS_SECRETS: z.string().optional().default(''),
  JWT_ACCESS_EXPIRES_IN: z.string().default('10m') as z.ZodType<StringValue>,
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d') as z.ZodType<StringValue>,
  JWT_ISSUER: z.string().default('arvino-api'),
  JWT_AUDIENCE: z.string().default('arvino-client'),

  MAX_FAILED_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  LOCK_DURATION_MINUTES: z.coerce.number().int().min(5).max(60).default(15),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  GOOGLE_PLACES_API_KEY: z.string(),

  RESEND_API_KEY: z.string(),
  MAIL_FROM: z.string().default('noreply@arvino.app'),

  PASSWORD_RESET_EXPIRES_IN_MINUTES: z.coerce.number().int().default(60),
  EMAIL_VERIFY_EXPIRES_IN_MINUTES: z.coerce.number().int().default(1440),

  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_DEFAULT_MODEL: z.string().default('anthropic/claude-3-haiku'),
  OPENROUTER_MAX_TOKENS: z.coerce.number().int().default(1000),

  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  CORS_ALLOWED_METHODS: z.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: z
    .string()
    .default('Origin,Content-Type,Accept,Authorization,X-CSRF-Token,X-Request-Id,X-Correlation-Id'),

  COOKIE_DOMAIN: z.string().optional().default(''),

  ENABLE_ANTIVIRUS_SCAN: z.coerce.boolean().default(false),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  MEDIA_MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(100).default(20),
  MEDIA_ALLOWED_IMAGE_MIME_TYPES: z
    .string()
    .default('image/jpeg,image/png,image/webp,image/heic,image/heif'),
  MEDIA_ALLOWED_VIDEO_MIME_TYPES: z.string().default('video/mp4,video/quicktime,video/webm'),
  MEDIA_MAX_VIDEO_DURATION_SECONDS: z.coerce.number().int().min(1).default(120),

  SENTRY_DSN: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;
