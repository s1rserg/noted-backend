import type { MediaModuleComposerArgs } from './types.js';
import { MediaRepository } from './repositories/media.repository.js';
import { UserMediaRepository } from './repositories/user-media.repository.js';
import { CloudinaryService } from './services/cloudinary.service.js';
import { UserAvatarService } from './services/user-avatar.service.js';

export const runMediaModuleComposer = ({
  dataSource,
  configService,
  loggerService,
}: MediaModuleComposerArgs) => {
  const mediaRepository = new MediaRepository(dataSource);
  const userMediaRepository = new UserMediaRepository(dataSource);

  const cloudinaryService = new CloudinaryService(configService, loggerService);
  const userAvatarService = new UserAvatarService(
    mediaRepository,
    userMediaRepository,
    cloudinaryService,
    dataSource,
  );

  return {
    userAvatarService,
  };
};
