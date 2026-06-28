import { randomBytes } from 'crypto';

import { AppConfigService } from '@config/config.service';
import { Request, Response } from 'express';
import ms from 'ms';

import { CSRF_TOKEN_COOKIE } from './constants.cookie';

export const createCsrfToken = (): string => randomBytes(32).toString('hex');

export const setCsrfTokenCookie = (
  res: Response,
  token: string,
  config: AppConfigService,
): void => {
  res.cookie(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: ms(config.jwtRefreshExpiresIn),
    path: '/',
  });
};

export const clearCsrfTokenCookie = (res: Response, config: AppConfigService): void => {
  res.clearCookie(CSRF_TOKEN_COOKIE, {
    httpOnly: false,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
  });
};

export const getCsrfTokenFromCookie = (req: Request): string | null => {
  return req.cookies[CSRF_TOKEN_COOKIE] || null;
};
