import type { AuthModuleComposerArgs } from './types.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { AuthRepository } from './repositories/auth.repository.js';
import { AuthService } from './services/auth.service.js';
import { AuthGoogleService } from './services/auth-google.service.js';
import { AuthLocalService } from './services/auth-local.service.js';
import { AuthRegistrationService } from './services/auth-registration.service.js';
import { CookiesService } from './services/cookies.service.js';
import { CryptoService } from './services/crypto.service.js';
import { JwtService } from './services/jwt.service.js';
import { AuthController } from './auth.controller.js';
import { createAuthRouter } from './auth.router.js';

import { createGoogleStrategy } from './strategies/google.strategy.js';
import passport from 'passport';

export const runAuthModuleComposer = ({
  dataSource,
  userService,
  configService,
}: AuthModuleComposerArgs) => {
  const jwtService = new JwtService(configService);
  const cryptoService = new CryptoService(configService);
  const cookiesService = new CookiesService(configService);

  const authRepository = new AuthRepository(dataSource);

  const authRegistrationService = new AuthRegistrationService(
    dataSource,
    userService,
    cryptoService,
    authRepository,
  );

  const authLocalService = new AuthLocalService(
    jwtService,
    cryptoService,
    authRepository,
    authRegistrationService,
  );

  const authService = new AuthService(jwtService);

  const authGoogleService = new AuthGoogleService(authRepository, authRegistrationService);
  const googleStrategy = createGoogleStrategy(configService, authGoogleService);
  passport.use(googleStrategy);

  const authController = new AuthController(
    authService,
    cookiesService,
    authLocalService,
    configService,
  );

  const refreshTokenGuard = new RefreshTokenGuard(jwtService);
  const accessTokenGuard = new AccessTokenGuard(jwtService);

  const authRouter = createAuthRouter(authController, refreshTokenGuard, configService);

  return { authRouter, accessTokenGuard };
};
