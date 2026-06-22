import { Request } from 'express';

export const parseIpAddress = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
  const remoteAddress = req.socket.remoteAddress;

  return (forwardedFor as string)?.split(',')[0]?.trim() ?? remoteAddress ?? 'unknown';
};
