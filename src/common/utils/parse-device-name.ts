import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export const parseDeviceName = (req: Request): string => {
  const ua = req.headers['user-agent'] ?? '';
  const parser = new UAParser(ua);
  const result = parser.getResult();

  const browser = result.browser.name ?? 'Unknown Browser';
  const os = result.os.name ?? 'Unknown OS';

  return `${browser} on ${os}`;
};
