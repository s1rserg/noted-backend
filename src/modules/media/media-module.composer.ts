import type { MediaModuleComposerArgs } from './types.js';
import { MediaRepository } from './repositories/media.repository.js';
import { UserMediaRepository } from './repositories/user-media.repository.js';
import { CloudinaryService } from './services/cloudinary.service.js';
import { MediaGcOrphanFinderService } from './services/media-gc-orphan-finder.service.js';
import { MediaGcProcessorService } from './services/media-gc-processor.service.js';
import { MediaGcQueueManager } from './services/media-gc-queue-manager.service.js';
import { MediaGcRetryService } from './services/media-gc-retry.service.js';
import { UserAvatarService } from './services/user-avatar.service.js';

import { MediaGcRepository } from './repositories/media-gc-repository.js';

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

  const mediaGcRepository = new MediaGcRepository(dataSource);

  const mediaGcProcessorService = new MediaGcProcessorService({
    dataSource,
    loggerService,
    mediaRepository,
    cloudinaryService,
    mediaGcRepository,
  });

  const redisConnection = {
    host: configService.env.REDIS_HOST,
    port: configService.env.REDIS_PORT,
  };

  const mediaGcQueueManager = new MediaGcQueueManager(
    redisConnection,
    mediaGcProcessorService,
    loggerService,
  );
  mediaGcQueueManager.startWorker();

  const mediaGcOrphanFinderService = new MediaGcOrphanFinderService(
    dataSource,
    mediaGcRepository,
    loggerService,
    mediaGcQueueManager.queue,
  );

  mediaGcOrphanFinderService.startCron(configService.env.MEDIA_GC_SCHEDULE);

  const mediaGcRetryService = new MediaGcRetryService(
    mediaGcRepository,
    loggerService,
    mediaGcQueueManager.queue,
  );

  mediaGcRetryService.startCron(configService.env.MEDIA_GC_RETRY_SCHEDULE);

  return {
    userAvatarService,
  };
};
