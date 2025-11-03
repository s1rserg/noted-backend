import { z } from 'zod';
import { TaskStatus } from '../enums/task-status.enum.js';

export const ReorderTaskSchema = z.object({
  nextTaskId: z.number().nullable(),
  status: z.enum(TaskStatus),
});
