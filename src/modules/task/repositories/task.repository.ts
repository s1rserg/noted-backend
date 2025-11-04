import {
  type DataSource,
  type DeleteResult,
  EntityManager,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';
import { type Nullable, SortOrder } from '@types';
import type {
  CreateTaskDto,
  TaskFindAllByPositionQuery,
  TaskFindAllQuery,
  UpdateTaskDto,
} from '../task.types.js';
import type { TaskStatus } from '../enums/task-status.enum.js';
import { applyFilters, applyPagination, applySearch, applySorting } from '@utils/typeorm-query';
import { TaskEntity } from '../entities/task.entity.js';

import { getSortExpressions } from '../utils/getSortExpressions.js';

export class TaskRepository {
  private readonly taskRepository: Repository<TaskEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.taskRepository = this.dataSource.getRepository(TaskEntity);
  }

  async findAll(authorId: number, query: TaskFindAllQuery): Promise<TaskEntity[]> {
    const queryBuilder = this.taskRepository.createQueryBuilder('tasks');
    const { q, searchBy, order, sortBy, page, perPage, status, priority } = query;

    applyFilters({ queryBuilder, filters: { status, priority } });

    applySearch({ q, searchBy, queryBuilder });

    applySorting({
      queryBuilder,
      sortBy,
      order,
      customSorts: getSortExpressions(queryBuilder.alias),
    });

    applyPagination({ page, perPage, queryBuilder });

    return queryBuilder.andWhere({ authorId }).getMany();
  }

  async findAllByPosition(
    authorId: number,
    query: TaskFindAllByPositionQuery,
  ): Promise<TaskEntity[]> {
    const queryBuilder = this.taskRepository.createQueryBuilder('tasks');
    const { status } = query;

    applyFilters({ queryBuilder, filters: { status } });

    applySorting({
      queryBuilder,
      sortBy: 'position',
      order: SortOrder.ASC,
    });

    return queryBuilder.andWhere({ authorId }).getMany();
  }

  async findOne(
    id: number,
    authorId?: number,
    manager?: EntityManager,
  ): Promise<Nullable<TaskEntity>> {
    const repo = manager ? manager.getRepository(TaskEntity) : this.taskRepository;
    return repo.findOneBy({ id, authorId });
  }

  async create(createTaskDto: CreateTaskDto, authorId: number): Promise<TaskEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager ? manager.getRepository(TaskEntity) : this.taskRepository;
      const status = createTaskDto.status;

      const position = await this.getNextPosition(status, authorId, manager);

      const task = repo.create({
        ...createTaskDto,
        authorId,
        position,
      });

      return repo.save(task);
    });
  }

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
    authorId?: number,
  ): Promise<Nullable<TaskEntity>> {
    const task = await this.findOne(id, authorId);
    if (!task) return null;

    const mergedTask = this.taskRepository.merge(task, updateTaskDto);
    return this.taskRepository.save(mergedTask);
  }

  async save(task: TaskEntity, manager?: EntityManager): Promise<TaskEntity> {
    const repo = manager ? manager.getRepository(TaskEntity) : this.taskRepository;
    return repo.save(task);
  }

  async incrementPositions(
    status: TaskStatus,
    authorId: number,
    fromPosition: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .getRepository(TaskEntity)
      .createQueryBuilder()
      .update(TaskEntity)
      .set({ position: () => '"position" + 1' })
      .where({ status, authorId })
      .andWhere({ position: MoreThanOrEqual(fromPosition) })
      .execute();
  }

  async getNextPosition(
    status: TaskStatus,
    authorId: number,
    manager: EntityManager,
  ): Promise<number> {
    const repo = manager.getRepository(TaskEntity);
    const { max } = (await repo
      .createQueryBuilder()
      .select('MAX(position)', 'max')
      .where({ status, authorId })
      .getRawOne<{ max: number }>()) ?? { max: 0 };

    return (max ?? 0) + 1;
  }

  async delete(id: number, authorId?: number): Promise<DeleteResult> {
    return this.taskRepository.delete({ id, authorId });
  }
}
