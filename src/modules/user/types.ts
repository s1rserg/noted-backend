import type { DataSource } from 'typeorm';
import type { infer as ZodInfer } from 'zod';
import type { Nullable } from '@types';
import type { CreateUserSchema } from './schemas/create-user.schema.js';
import type { UpdateUserSchema } from './schemas/update-user.schema.js';

export type CreateUserDto = ZodInfer<typeof CreateUserSchema>;

export type UpdateUserDto = ZodInfer<typeof UpdateUserSchema>;

export interface UserResponse {
  id: number;
  email: string;
  name: Nullable<string>;
  surname: Nullable<string>;
  birthday: Nullable<Date>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModuleComposerArgs {
  dataSource: DataSource;
}
