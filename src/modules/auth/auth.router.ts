import { type RequestHandler, Router } from 'express';
import type { ConfigService } from '@infrastructure/config-service/index.js';
import { SignInLocalSchema } from './schemas/sign-in-local.schema.js';
import { SignUpLocalSchema } from './schemas/sign-up-local.schema.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { AuthController } from './auth.controller.js';
import { validateBodyMiddleware } from '@validation-middlewares/validate-body.middleware.js';

import passport from 'passport';

export const createAuthRouter = (
  authController: AuthController,
  refreshTokenGuard: RefreshTokenGuard,
  configService: ConfigService,
): Router => {
  const authRouter = Router();

  authRouter.post('/sign-in', [validateBodyMiddleware(SignInLocalSchema)], authController.signIn);

  authRouter.post('/sign-up', [validateBodyMiddleware(SignUpLocalSchema)], authController.signUp);

  authRouter.get('/sign-out', [refreshTokenGuard.canActivate], authController.signOut);

  authRouter.get('/refresh', [refreshTokenGuard.canActivate], authController.refresh);

  authRouter.get('/google', passport.authenticate('google', { session: false }) as RequestHandler);

  authRouter.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${configService.env.CLIENT_URL}/sign-in`,
    }) as RequestHandler,
    authController.googleCallback,
  );

  return authRouter;
};
