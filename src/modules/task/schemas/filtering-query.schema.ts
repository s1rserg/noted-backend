import { z } from 'zod';
import { TaskPriority } from '@modules/task/enums/task-priority.enum.js';
import { TaskStatus } from '@modules/task/enums/task-status.enum.js';

const TaskStatusValues = Object.values(TaskStatus);
const TaskPriorityValues = Object.values(TaskPriority);

export const FilteringSchema = z.strictObject({
  status: z
    .enum(TaskStatus, `Task status must be one of: ${TaskStatusValues.join(', ')}`)
    .optional(),

  priority: z
    .enum(TaskPriority, `Task priority must be one of: ${TaskPriorityValues.join(', ')}`)
    .optional(),
});
