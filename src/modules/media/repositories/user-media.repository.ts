import type { DataSource, EntityManager, Repository } from 'typeorm';
import type { Nullable } from '@types';
import type { CreateUserMediaDto, UpdateUserMediaDto, UserMediaRole } from '../types.js';
import { UserMediaEntity } from '../entities/user-media.entity.js';

export class UserMediaRepository {
  private readonly userMediaRepository: Repository<UserMediaEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.userMediaRepository = this.dataSource.getRepository(UserMediaEntity);
  }

  async findMainByUserAndRole(
    userId: number,
    role: UserMediaRole,
    manager?: EntityManager,
  ): Promise<Nullable<UserMediaEntity>> {
    const repository = this.getRepository(manager);
    return repository.findOne({ where: { userId, role, isMain: true } });
  }

  async findMainWithMediaByUserAndRole(
    userId: number,
    role: UserMediaRole,
    manager?: EntityManager,
  ): Promise<Nullable<UserMediaEntity>> {
    const repository = this.getRepository(manager);
    return repository.findOne({
      where: { userId, role, isMain: true },
      relations: { media: true },
    });
  }

  async findAllByUserAndRole(
    userId: number,
    role: UserMediaRole,
    manager?: EntityManager,
  ): Promise<UserMediaEntity[]> {
    const repository = this.getRepository(manager);
    return repository.find({ where: { userId, role } });
  }

  async findAllWithMediaByUserAndRole(
    userId: number,
    role: UserMediaRole,
    manager?: EntityManager,
  ): Promise<UserMediaEntity[]> {
    const repository = this.getRepository(manager);
    return repository.find({
      where: { userId, role },
      relations: { media: true },
    });
  }

  async findOneWithMediaByUserMediaAndRole(
    userId: number,
    mediaId: number,
    role: UserMediaRole,
    manager?: EntityManager,
  ): Promise<Nullable<UserMediaEntity>> {
    const repository = this.getRepository(manager);
    return repository.findOne({
      where: { userId, mediaId, role },
      relations: { media: true },
    });
  }

  async create(userMedia: CreateUserMediaDto, manager?: EntityManager): Promise<UserMediaEntity> {
    const repository = this.getRepository(manager);
    return repository.save(userMedia);
  }

  async update(
    id: number,
    userMedia: UpdateUserMediaDto,
    manager?: EntityManager,
  ): Promise<Nullable<UserMediaEntity>> {
    const repository = this.getRepository(manager);
    const entity = await repository.preload({ id, ...userMedia });
    if (!entity) return null;
    return repository.save(entity);
  }

  private getRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(UserMediaEntity) : this.userMediaRepository;
  }
}
