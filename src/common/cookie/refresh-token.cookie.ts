import { AppConfigService } from '@config/config.service';
import { Request, Response } from 'express';
import ms from 'ms';

import { REFRESH_TOKEN_COOKIE } from './constants.cookie';

const getApiPrefix = (config: AppConfigService): string => {
  return `/${config.prefix}/auth`;
};

export const setRefreshTokenCookie = (
  res: Response,
  token: string,
  config: AppConfigService,
): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'strict',
    maxAge: ms(config.jwtRefreshExpiresIn),
    path: getApiPrefix(config),
  });
};

export const clearRefreshTokenCookie = (res: Response, config: AppConfigService): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'strict',
    path: getApiPrefix(config),
  });
};

export const getRefreshTokenFromCookie = (req: Request): string | null => {
  return req.cookies[REFRESH_TOKEN_COOKIE] || null;
};
