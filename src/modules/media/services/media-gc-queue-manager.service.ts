import type { LoggerService } from '@infrastructure/logger';
import type { GcMediaJobData } from '../types.js';
import type { MediaGcProcessorService } from '../services/media-gc-processor.service.js';

import { GC_MEDIA_QUEUE_NAME } from '../config.js';
import { type ConnectionOptions, Queue, Worker } from 'bullmq';

export class MediaGcQueueManager {
  public readonly queue: Queue<GcMediaJobData>;
  private worker: Worker<GcMediaJobData>;

  constructor(
    private readonly connection: ConnectionOptions,
    private readonly processorService: MediaGcProcessorService,
    private readonly logger: LoggerService,
  ) {
    this.queue = new Queue<GcMediaJobData>(GC_MEDIA_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    });
  }

  public startWorker() {
    this.worker = new Worker<GcMediaJobData>(
      GC_MEDIA_QUEUE_NAME,
      async (job) => {
        await this.processorService.processOrphan(job.data.gcMediaId);
      },
      { connection: this.connection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `GC Job ${job?.id} (mediaId ${job?.data.gcMediaId}) failed: ${err.message}`,
      );
    });
  }
}
