import { z } from 'zod';
import { TaskPriority } from '../enums/task-priority.enum.js';
import { TaskStatus } from '../enums/task-status.enum.js';

const TaskStatusValues = Object.values(TaskStatus);
const TaskPriorityValues = Object.values(TaskPriority);

export const CreateTaskSchema = z.strictObject({
  title: z.string('Title is required field').min(3, 'Min title length is 3'),
  description: z.string('Description is required field').min(5, 'Min description length is 5'),
  deadline: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  status: z
    .enum(TaskStatus, `Task status must be one of: ${TaskStatusValues.join(', ')}`)
    .optional()
    .default(TaskStatus.PENDING),
  priority: z
    .enum(TaskPriority, `Task priority must be one of: ${TaskPriorityValues.join(', ')}`)
    .optional()
    .default(TaskPriority.MEDIUM),
  tags: z.array(z.string()).optional(),
});
