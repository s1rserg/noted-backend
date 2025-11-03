import { z } from 'zod';
import { TaskStatus } from '@modules/task/enums/task-status.enum.js';

const TaskStatusValues = Object.values(TaskStatus);

export const ByPositionFilteringSchema = z.strictObject({
  status: z.enum(TaskStatus, `Task status must be one of: ${TaskStatusValues.join(', ')}`),
});
