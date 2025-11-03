import type { ConfigService } from '@infrastructure/config-service';
import type { LoggerService } from '@infrastructure/logger';
import type { FileUpload } from '@types';
import type {
  CloudinaryDestroyData,
  CloudinaryError,
  CloudinaryUploadData,
  CloudinaryUploadResult,
} from '../types.js';
import { InternalServerErrorException } from '@exceptions';

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export class CloudinaryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.env.CLOUDINARY_CLOUD_NAME,
      api_key: this.configService.env.CLOUDINARY_API_KEY,
      api_secret: this.configService.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async upload(file: FileUpload, assetFolder: string): Promise<CloudinaryUploadResult> {
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: assetFolder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error?: CloudinaryError, result?: CloudinaryUploadData) => {
          if (error) {
            return reject(new InternalServerErrorException(error.message));
          }
          if (!result || !result.asset_id) {
            return reject(
              new InternalServerErrorException(
                'Cloudinary upload failed: missing critical data (asset_id).',
              ),
            );
          }

          const mappedResult: CloudinaryUploadResult = {
            assetId: result.asset_id,
            publicId: result.public_id,
            format: result.format ?? '',
            resourceType: result.resource_type,
            createdAt: new Date(result.created_at),
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            assetFolder: result.folder ?? '',
            displayName: result.original_filename ?? result.public_id,
            secureUrl: result.secure_url,
          };
          resolve(mappedResult);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async delete(publicId: string, resourceType: string): Promise<void> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })) as CloudinaryDestroyData;

      if (result?.result !== 'ok' && result?.result !== 'not found') {
        throw new InternalServerErrorException(
          `Failed to delete from Cloudinary: ${result?.result ?? 'unknown_error'}`,
        );
      }
    } catch (error) {
      this.loggerService.error(error);
      throw new InternalServerErrorException((error as InternalServerErrorException).message);
    }
  }
}
