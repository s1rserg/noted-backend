import type { LoggerService } from '@infrastructure/logger';
import type { GcMediaJobData } from '../types.js';
import { MediaGcStatus } from '../types.js';

import { MAX_GC_ATTEMPTS } from '../config.js';
import type { MediaGcRepository } from '../repositories/media-gc-repository.js';
import type { Queue } from 'bullmq';
import cron from 'node-cron';

export class MediaGcRetryService {
  constructor(
    private readonly mediaGcRepository: MediaGcRepository,
    private readonly logger: LoggerService,
    private readonly gcMediaQueue: Queue<GcMediaJobData>,
  ) {}

  startCron(schedule: string) {
    cron.schedule(schedule, async () => {
      try {
        await this.requeueFailedJobs();
      } catch (err) {
        this.logger.error(err);
      }
    });
  }

  async requeueFailedJobs() {
    const jobsToRetry = await this.mediaGcRepository.findRetryableFailedJobs(MAX_GC_ATTEMPTS);
    if (jobsToRetry.length === 0) return;

    this.logger.info(`GC Retry: Found ${jobsToRetry.length} jobs to requeue for a 2nd cycle.`);

    for (const job of jobsToRetry) {
      job.status = MediaGcStatus.PENDING;
      await this.mediaGcRepository.save(job);

      await this.gcMediaQueue.add(
        'process-orphan',
        { gcMediaId: job.id },
        {
          jobId: `gc-media-${job.id}`,
        },
      );
    }
  }
}
