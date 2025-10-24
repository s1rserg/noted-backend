import type { ConfigService } from '@infrastructure/config-service';
import type { AuthGoogleService } from '../services/auth-google.service.js';

import { type Profile, Strategy as GoogleStrategy } from 'passport-google-oauth20';

export const createGoogleStrategy = (
  configService: ConfigService,
  authGoogleService: AuthGoogleService,
) => {
  return new GoogleStrategy(
    {
      clientID: configService.env.GOOGLE_CLIENT_ID,
      clientSecret: configService.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${configService.env.SERVER_URL}/api/v1/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        if (!profile.emails || !profile.emails[0]) {
          return done(new Error('Google profile did not return an email'), false);
        }

        const email = profile.emails[0].value;

        authGoogleService
          .signInOrSignUp(email)
          .then((auth) => {
            return done(null, auth);
          })
          .catch((error) => {
            return done(error, false);
          });
      } catch (error) {
        return done(error, false);
      }
    },
  );
};
