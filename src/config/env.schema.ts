import { StringValue } from 'ms';
import z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  PREFIX: z.string().default('api'),

  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  TOKEN_BYTES: z.coerce.number().int().min(32).max(64).default(32),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m') as z.ZodType<StringValue>,
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d') as z.ZodType<StringValue>,
});

export type Env = z.infer<typeof envSchema>;
