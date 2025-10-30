import type { DataSource } from 'typeorm';
import type { LoggerService } from '@infrastructure/logger';
import { type MediaGcProcessorServiceArgs, MediaGcStatus } from '../types.js';
import { MediaRepository } from '../repositories/media.repository.js';
import { CloudinaryService } from './cloudinary.service.js';

import { MAX_GC_ATTEMPTS } from '../config.js';
import type { MediaGcRepository } from '../repositories/media-gc-repository.js';

export class MediaGcProcessorService {
  private readonly dataSource: DataSource;
  private readonly logger: LoggerService;
  private readonly mediaRepository: MediaRepository;
  private readonly cloudinaryService: CloudinaryService;
  private readonly mediaGcRepository: MediaGcRepository;

  constructor(args: MediaGcProcessorServiceArgs) {
    this.dataSource = args.dataSource;
    this.logger = args.loggerService;
    this.mediaRepository = args.mediaRepository;
    this.cloudinaryService = args.cloudinaryService;
    this.mediaGcRepository = args.mediaGcRepository;
  }

  async processOrphan(gcMediaId: number): Promise<void> {
    const success = await this.dataSource.transaction(async (manager) => {
      const gcEntry = await this.mediaGcRepository.findByIdAndLock(gcMediaId, manager);
      if (!gcEntry || gcEntry.status === MediaGcStatus.FAILED) return true;

      gcEntry.status = MediaGcStatus.PROCESSING;
      gcEntry.attempts += 1;
      gcEntry.lastAttemptAt = new Date();
      await this.mediaGcRepository.save(gcEntry, manager);

      try {
        await this.cloudinaryService.delete(gcEntry.publicId, gcEntry.resourceType);

        await this.mediaGcRepository.delete(gcEntry.id, manager);

        await this.mediaRepository.delete(gcEntry.mediaId, manager);

        return true;
      } catch (error) {
        this.logger.error(error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        gcEntry.lastError = errorMessage.substring(0, 1000);

        if (gcEntry.attempts >= MAX_GC_ATTEMPTS) {
          gcEntry.status = MediaGcStatus.FAILED;
        } else {
          gcEntry.status = MediaGcStatus.PENDING;
        }
        await this.mediaGcRepository.save(gcEntry, manager);
        return false;
      }
    });
    if (!success) {
      throw new Error(`GC Job ${gcMediaId} failed.`);
    }
  }
}
