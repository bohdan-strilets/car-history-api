import { Prisma } from '@prisma/client';

export const mediaInclude = {
  variants: true,
  usages: true,
} satisfies Prisma.MediaInclude;
