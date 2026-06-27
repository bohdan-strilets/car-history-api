import { BadRequestException } from '@nestjs/common';

import { envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    throw new BadRequestException({
      statusCode: 400,
      message: 'Invalid environment variables',
      errors: fieldErrors,
    });
  }

  return result.data;
}
