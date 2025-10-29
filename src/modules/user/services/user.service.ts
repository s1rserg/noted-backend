import type { EntityManager } from 'typeorm';
import type { MediaDto, UserAvatarService } from '@modules/media/index.js';
import type { FileUpload, MessageResponse, Nullable } from '@types';
import type { CreateUserDto, UpdateUserDto, UserDto, UserResponse } from '../types.js';
import type { UserRepository } from '../repositories/user.repository.js';
import { ConflictException, NotFoundException } from '@exceptions';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userAvatarService: UserAvatarService,
  ) {}

  async findOne(id: number): Promise<UserDto> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const avatar = await this.userAvatarService.findMainAvatar(id);

    return {
      ...user,
      avatar,
    };
  }

  async findOneByEmailOrNull(
    email: string,
    manager?: EntityManager,
  ): Promise<Nullable<UserResponse>> {
    return this.userRepository.findByField('email', email, manager);
  }

  // todo: add validation for query error
  async create(createUserDto: CreateUserDto, manager?: EntityManager): Promise<UserResponse> {
    const existingUser = await this.userRepository.findByField(
      'email',
      createUserDto.email,
      manager,
    );
    if (existingUser) {
      throw new ConflictException(`User already exists`);
    }

    return this.userRepository.create(createUserDto, manager);
  }

  async update(userId: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const updatedUser = await this.userRepository.update(userId, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`User not found`);
    }

    const avatar = await this.userAvatarService.findMainAvatar(userId);

    return {
      ...updatedUser,
      avatar,
    };
  }

  async delete(userId: number): Promise<MessageResponse> {
    const deleteRes = await this.userRepository.delete(userId);

    if (deleteRes.affected === 0) {
      throw new NotFoundException(`User not found`);
    }

    return { message: 'User deleted successfully' };
  }

  async uploadAvatar(userId: number, file: FileUpload): Promise<MediaDto> {
    return this.userAvatarService.createAvatar(userId, file);
  }

  async getAllUserAvatars(userId: number): Promise<MediaDto[]> {
    return this.userAvatarService.getAllAvatars(userId);
  }

  async setUserMainAvatar(userId: number, mediaId: number): Promise<MediaDto> {
    return this.userAvatarService.setMainAvatar(userId, mediaId);
  }

  async deleteUserAvatar(userId: number, mediaId: number): Promise<MessageResponse> {
    return this.userAvatarService.deleteAvatar(userId, mediaId);
  }
}
