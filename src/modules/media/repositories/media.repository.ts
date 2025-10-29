import type { DataSource, DeleteResult, EntityManager, Repository } from 'typeorm';
import type { CreateMediaDto } from '../types.js';
import { MediaEntity } from '../entities/media.entity.js';

export class MediaRepository {
  private readonly mediaRepository: Repository<MediaEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.mediaRepository = this.dataSource.getRepository(MediaEntity);
  }

  async create(media: CreateMediaDto, manager?: EntityManager): Promise<MediaEntity> {
    const repository = this.getRepository(manager);
    const newMedia = repository.create({ ...media, recordCreatedAt: new Date() });
    return repository.save(newMedia);
  }

  async delete(id: number, manager?: EntityManager): Promise<DeleteResult> {
    const repository = this.getRepository(manager);
    return repository.delete(id);
  }

  private getRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(MediaEntity) : this.mediaRepository;
  }
}
