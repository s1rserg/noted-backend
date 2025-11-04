import { z } from 'zod';
import type { PositionCursor } from '../task.types.js';
import { TaskStatus } from '../enums/task-status.enum.js';

const TaskStatusValues = Object.values(TaskStatus);

const CursorSchema = z.object({
  id: z.number().int().positive(),
});

export const TaskCursorQuerySchema = z.strictObject({
  status: z.enum(TaskStatus, `Task status must be one of: ${TaskStatusValues.join(', ')}`),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  cursor: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      try {
        const decoded = Buffer.from(val, 'base64').toString('utf8');
        const json = JSON.parse(decoded) as PositionCursor;
        const parsed = CursorSchema.safeParse(json);
        if (!parsed.success) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid cursor format',
          });
          return z.NEVER;
        }
        return parsed.data;
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid cursor encoding',
        });
        return z.NEVER;
      }
    }),
});
