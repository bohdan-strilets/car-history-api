import { AppConfigService } from '@config/config.service';

type CookieDomainOption = { domain: string } | Record<string, never>;

export const getCookieSameSite = (config: AppConfigService): 'none' | 'strict' | 'lax' => {
  if (config.cookieDomain) {
    return 'lax';
  }
  return config.isProduction ? 'none' : 'strict';
};

export const getCookieDomainOption = (config: AppConfigService): CookieDomainOption => {
  return config.cookieDomain ? { domain: config.cookieDomain } : {};
};
