import type { DataSource } from 'typeorm';
import type { ConfigService } from '@infrastructure/config-service/index.js';
import type { LoggerService } from '@infrastructure/logger/index.js';
import type { MediaEntity } from './entities/media.entity.js';

export interface MediaModuleComposerArgs {
  dataSource: DataSource;
  configService: ConfigService;
  loggerService: LoggerService;
}

export enum UserMediaRole {
  AVATAR = 'AVATAR',
}

export type CreateMediaDto = Omit<MediaEntity, 'id' | 'recordCreatedAt' | 'recordUpdatedAt'>;

export type CreateUserMediaDto = {
  userId: number;
  mediaId: number;
  role: UserMediaRole;
  isMain: boolean;
};

export type UpdateUserMediaDto = {
  mediaId?: number;
  isMain?: boolean;
};

export interface MediaDto {
  id: number;
  createdAt: string;
  width: number;
  height: number;
  secureUrl: string;
}

//CLOUDINARY

export type CloudinaryUploadResult = CreateMediaDto;

export type CloudinaryError = {
  message: string;
};

export type CloudinaryUploadData = {
  asset_id?: string;
  public_id: string;
  format?: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder?: string;
  original_filename?: string;
  secure_url: string;
};

export type CloudinaryDestroyData = {
  result?: string;
};
