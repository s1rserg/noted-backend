import type { DataSource } from 'typeorm';
import type { FileUpload, MessageResponse, Nullable } from '@types';
import { type MediaDto, UserMediaRole } from '../types.js';
import type { MediaEntity } from '../entities/media.entity.js';
import type { UserMediaEntity } from '../entities/user-media.entity.js';
import type { MediaRepository } from '../repositories/media.repository.js';
import type { UserMediaRepository } from '../repositories/user-media.repository.js';
import type { CloudinaryService } from './cloudinary.service.js';
import { NotFoundException } from '@exceptions';

export class UserAvatarService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly userMediaRepository: UserMediaRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}

  async createAvatar(userId: number, file: FileUpload): Promise<MediaDto> {
    return this.dataSource.transaction(async (manager) => {
      const uploadResult = await this.cloudinaryService.upload(file, 'avatars');

      const media = await this.mediaRepository.create(uploadResult, manager);

      const currentMainLink = await this.userMediaRepository.findMainByUserAndRole(
        userId,
        UserMediaRole.AVATAR,
        manager,
      );

      if (currentMainLink) {
        await this.userMediaRepository.update(currentMainLink.id, { isMain: false }, manager);
      }

      await this.userMediaRepository.create(
        {
          userId,
          mediaId: media.id,
          role: UserMediaRole.AVATAR,
          isMain: true,
        },
        manager,
      );

      return this.toDto(media);
    });
  }

  async findMainAvatar(userId: number): Promise<Nullable<MediaDto>> {
    const avatarLink = await this.userMediaRepository.findMainWithMediaByUserAndRole(
      userId,
      UserMediaRole.AVATAR,
    );
    return avatarLink ? this.toDto(avatarLink.media) : null;
  }

  async getAllAvatars(userId: number): Promise<MediaDto[]> {
    const avatarLinks = await this.userMediaRepository.findAllWithMediaByUserAndRole(
      userId,
      UserMediaRole.AVATAR,
    );
    return avatarLinks.map((link) => this.toDto(link.media));
  }

  async setMainAvatar(userId: number, mediaIdToMakeMain: number): Promise<MediaDto> {
    return this.dataSource.transaction(async (manager) => {
      const targetLink = await this.userMediaRepository.findOneWithMediaByUserMediaAndRole(
        userId,
        mediaIdToMakeMain,
        UserMediaRole.AVATAR,
        manager,
      );

      if (!targetLink) {
        throw new NotFoundException(
          `Avatar with mediaId ${mediaIdToMakeMain} not found for this user`,
        );
      }

      const currentMainLink = await this.userMediaRepository.findMainByUserAndRole(
        userId,
        UserMediaRole.AVATAR,
        manager,
      );

      if (currentMainLink && currentMainLink.id !== targetLink.id) {
        await this.userMediaRepository.update(currentMainLink.id, { isMain: false }, manager);
      }

      await this.userMediaRepository.update(targetLink.id, { isMain: true }, manager);

      return this.toDto(targetLink.media);
    });
  }

  async deleteAvatar(userId: number, mediaIdToDelete: number): Promise<MessageResponse> {
    const mediaToDelete = await this.performDbDeletion(userId, mediaIdToDelete);
    await this.cloudinaryService.delete(mediaToDelete.publicId, mediaToDelete.resourceType);

    return { message: 'Avatar deleted successfully' };
  }

  private async performDbDeletion(
    userId: number,
    mediaIdToDelete: number,
  ): Promise<{ publicId: string; resourceType: string }> {
    return this.dataSource.transaction(async (manager) => {
      const targetLink = await this.userMediaRepository.findOneWithMediaByUserMediaAndRole(
        userId,
        mediaIdToDelete,
        UserMediaRole.AVATAR,
        manager,
      );

      if (!targetLink) {
        throw new NotFoundException(
          `Avatar with mediaId ${mediaIdToDelete} not found for this user`,
        );
      }

      let newMainLink: Nullable<UserMediaEntity> = null;
      if (targetLink.isMain) {
        const allLinks = await this.userMediaRepository.findAllByUserAndRole(
          userId,
          UserMediaRole.AVATAR,
          manager,
        );
        const otherLinks = allLinks.filter((link) => link.mediaId !== mediaIdToDelete);

        if (otherLinks.length > 0 && otherLinks[0]) {
          otherLinks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          newMainLink = otherLinks[0];
        }
      }

      await this.mediaRepository.delete(mediaIdToDelete, manager);

      if (newMainLink) {
        await this.userMediaRepository.update(newMainLink.id, { isMain: true }, manager);
      }

      return {
        publicId: targetLink.media.publicId,
        resourceType: targetLink.media.resourceType,
      };
    });
  }

  toDto = (entity: MediaEntity): MediaDto => {
    return {
      id: entity.id,
      createdAt: entity.createdAt.toISOString(),
      width: entity.width,
      height: entity.height,
      secureUrl: entity.secureUrl,
    };
  };
}
