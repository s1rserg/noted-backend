import { type DataSource, type DeleteResult, MoreThanOrEqual, type Repository } from 'typeorm';
import type { Nullable } from '@types';
import type { CreateTaskDto, TaskFindAllQuery, UpdateTaskDto } from '../task.types.js';
import type { TaskStatus } from '../enums/task-status.enum.js';
import { applyFilters, applyPagination, applySearch, applySorting } from '@utils/typeorm-query';
import { TaskEntity } from '../entities/task.entity.js';
import { TaskNotFoundException } from '../exceptions/task-not-found.exception.js';

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

  async findOne(id: number, authorId?: number): Promise<Nullable<TaskEntity>> {
    return this.taskRepository.findOneBy({ id, authorId });
  }

  async create(createTaskDto: CreateTaskDto, authorId: number): Promise<TaskEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TaskEntity);
      const status = createTaskDto.status;

      const position = await this.getNextPosition(status, authorId, repo);

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

  async reorder(id: number, nextTaskId: Nullable<number>, authorId: number, status: TaskStatus) {
    return this.dataSource.transaction(async (manager) => {
      const taskRepo = manager.getRepository(TaskEntity);

      const movingTask = await taskRepo.findOneBy({ id, authorId });
      if (!movingTask) throw new TaskNotFoundException();

      if (movingTask.status !== status) {
        movingTask.status = status;
      }

      const nextTask = nextTaskId ? await taskRepo.findOneBy({ id: nextTaskId, authorId }) : null;

      if (!nextTask) {
        movingTask.position = await this.getNextPosition(status, authorId, taskRepo);
      } else {
        await taskRepo
          .createQueryBuilder()
          .update(TaskEntity)
          .set({ position: () => '"position" + 1' })
          .where({ status: movingTask.status, authorId })
          .andWhere({ position: MoreThanOrEqual(nextTask.position) })
          .execute();

        movingTask.position = nextTask.position;
      }

      await taskRepo.save(movingTask);
      return movingTask;
    });
  }

  private async getNextPosition(
    status: TaskStatus,
    authorId: number,
    repo: Repository<TaskEntity>,
  ): Promise<number> {
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
