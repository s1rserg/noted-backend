import { TaskPriority } from '../enums/task-priority.enum.js';
import { TaskStatus } from '../enums/task-status.enum.js';

export const getSortExpressions = (alias: string) => ({
  status: `
    CASE
      WHEN ${alias}.status = '${TaskStatus.PENDING}' THEN 1
      WHEN ${alias}.status = '${TaskStatus.IN_PROGRESS}' THEN 2
      WHEN ${alias}.status = '${TaskStatus.COMPLETED}' THEN 3
      ELSE 4
    END
  `,
  priority: `
    CASE
      WHEN ${alias}.priority = '${TaskPriority.LOW}' THEN 1
      WHEN ${alias}.priority = '${TaskPriority.MEDIUM}' THEN 2
      WHEN ${alias}.priority = '${TaskPriority.HIGH}' THEN 3
      ELSE 4
    END
  `,
});
