import z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  PREFIX: z.string().default('api'),

  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  TOKEN_BYTES: z.coerce.number().int().min(32).max(64).default(32),
});

export type Env = z.infer<typeof envSchema>;
