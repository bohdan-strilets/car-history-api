import { AppConfigService } from '@config/config.service';
import { CreateGoogleUserDto } from '@modules/users';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: AppConfigService) {
    super({
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): CreateGoogleUserDto {
    const email = profile.emails?.[0]?.value?.toLowerCase().trim();
    const firstName = profile.name?.givenName?.trim();
    const lastName = profile.name?.familyName?.trim();

    if (!email) {
      throw new BadRequestException('Google profile must have a verified email address');
    }

    if (!firstName || !lastName) {
      throw new BadRequestException('Google profile must have first and last names');
    }

    return {
      email,
      firstName,
      lastName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
