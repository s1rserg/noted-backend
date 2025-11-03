import type { DataSource } from 'typeorm';
import type { LoggerService } from '@infrastructure/logger';
import type { GcMediaJobData } from '../types.js';
import type { MediaGcEntity } from '../entities/media-gc.entity.js';

import type { MediaGcRepository } from '../repositories/media-gc-repository.js';
import type { Queue } from 'bullmq';
import cron from 'node-cron';

export class MediaGcOrphanFinderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mediaGcRepository: MediaGcRepository,
    private readonly logger: LoggerService,
    private readonly gcMediaQueue: Queue<GcMediaJobData>,
  ) {}

  startCron(schedule: string) {
    cron.schedule(schedule, async () => {
      try {
        await this.findAndEnqueueOrphans();
      } catch (err) {
        this.logger.error(err);
      }
    });
  }

  async findAndEnqueueOrphans() {
    const newOrphans = await this.dataSource.transaction(async (manager) => {
      return this.mediaGcRepository.stageOrphans(manager);
    });

    if (newOrphans.length === 0) return;

    const jobs = newOrphans.map((orphan: MediaGcEntity) => ({
      name: 'process-orphan',
      data: { gcMediaId: orphan.id },
      opts: {
        jobId: `gc-media-${orphan.id}`,
      },
    }));

    await this.gcMediaQueue.addBulk(jobs);
    this.logger.info(`GC: Enqueued ${jobs.length} new deletion jobs.`);
  }
}
