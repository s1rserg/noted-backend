import { Router } from 'express';
import { ParamsMediaIdSchema } from './schemas/params-mediaId.schema.js';
import { UpdateUserSchema } from './schemas/update-user.schema.js';
import { UploadAvatarSchema } from './schemas/upload-avatar.schema.js';
import { UserController } from './user.controller.js';
import { uploadFileMiddleware } from '@upload-middlewares/upload-file.middleware.js';
import { validateBodyMiddleware } from '@validation-middlewares/validate-body.middleware.js';
import { validateMultipartMiddleware } from '@validation-middlewares/validate-multipart.middleware.js';
import { validateParamsMiddleware } from '@validation-middlewares/validate-params.middleware.js';

export const createUserRouter = (userController: UserController): Router => {
  const userRouter = Router();

  userRouter.get('/me', userController.me);

  userRouter.patch('/me', [validateBodyMiddleware(UpdateUserSchema)], userController.updateMe);

  userRouter.post(
    '/me/avatars',
    [uploadFileMiddleware('file'), validateMultipartMiddleware(UploadAvatarSchema)],
    userController.uploadAvatar,
  );

  userRouter.get('/me/avatars', userController.getAllAvatars);

  userRouter.patch(
    '/me/avatars/:mediaId/set-main',
    validateParamsMiddleware(ParamsMediaIdSchema),
    userController.setMainAvatar,
  );

  userRouter.delete(
    '/me/avatars/:mediaId',
    validateParamsMiddleware(ParamsMediaIdSchema),
    userController.deleteAvatar,
  );

  userRouter.delete('/me', userController.deleteMe);

  return userRouter;
};
