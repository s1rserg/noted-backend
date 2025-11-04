import type { DataSource } from 'typeorm';
import type { ActiveUser } from '@modules/auth';
import type { MessageResponse } from '@types';
import type {
  CreateTaskDto,
  ReorderTaskDto,
  TaskCursorResponse,
  TaskFindAllCursorQuery,
  TaskFindAllQuery,
  TaskResponse,
  UpdateTaskDto,
} from '../task.types.js';
import type { TaskRepository } from '../repositories/task.repository.js';
import { TaskNotFoundException } from '../exceptions/task-not-found.exception.js';

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(user: ActiveUser, query: TaskFindAllQuery): Promise<TaskResponse[]> {
    return this.taskRepository.findAll(user.id, query);
  }

  async findAllByCursor(
    user: ActiveUser,
    query: TaskFindAllCursorQuery,
  ): Promise<TaskCursorResponse> {
    const { status, cursor, limit } = query;
    const authorId = user.id;
    const take = limit + 1;

    const tasks = await this.taskRepository.findAllWithCursor(authorId, status, take, cursor?.id);

    let hasMore = false;
    if (tasks.length > limit) {
      tasks.pop();
      hasMore = true;
    }

    return { data: tasks, hasMore };
  }

  async findOne(id: number, user: ActiveUser): Promise<TaskResponse> {
    const task = await this.taskRepository.findOne(id, user.id);
    if (!task) throw new TaskNotFoundException();

    return task;
  }

  async create(createTaskDto: CreateTaskDto, user: ActiveUser): Promise<TaskResponse> {
    return this.taskRepository.create(createTaskDto, user.id);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: ActiveUser): Promise<TaskResponse> {
    const updatedTask = await this.taskRepository.update(id, updateTaskDto, user.id);
    if (!updatedTask) throw new TaskNotFoundException();

    return updatedTask;
  }

  async reorder(
    id: number,
    reorderTaskDto: ReorderTaskDto,
    user: ActiveUser,
  ): Promise<TaskResponse> {
    const { nextTaskId, status } = reorderTaskDto;
    const authorId = user.id;

    return this.dataSource.transaction(async (manager) => {
      const movingTask = await this.taskRepository.findOne(id, authorId, manager);
      if (!movingTask) throw new TaskNotFoundException();

      if (movingTask.status !== status) {
        movingTask.status = status;
      }

      const nextTask = nextTaskId
        ? await this.taskRepository.findOne(nextTaskId, authorId, manager)
        : null;

      if (!nextTask) {
        movingTask.position = await this.taskRepository.getNextPosition(status, authorId, manager);
      } else {
        await this.taskRepository.incrementPositions(status, authorId, nextTask.position, manager);
        movingTask.position = nextTask.position;
      }

      return this.taskRepository.save(movingTask, manager);
    });
  }

  async delete(id: number, user: ActiveUser): Promise<MessageResponse> {
    const deleteResult = await this.taskRepository.delete(id, user.id);
    if (!deleteResult.affected) throw new TaskNotFoundException();

    return { message: 'Task deleted successfully' };
  }
}
