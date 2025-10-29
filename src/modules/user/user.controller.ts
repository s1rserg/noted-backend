import type { Response } from 'express';
import type { FileUpload, TypedRequest } from '@types';
import type { UpdateUserDto } from './types.js';
import type { UserService } from './services/user.service.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  me = async (req: TypedRequest<{ params: { id: number } }>, res: Response) => {
    const user = req.user!;
    const currentUser = await this.userService.findOne(user.id);
    res.status(200).json(currentUser);
  };

  updateMe = async (req: TypedRequest<{ body: UpdateUserDto }>, res: Response) => {
    const user = req.user!;
    const updateUserDto = req.validated.body;
    const updatedUser = await this.userService.update(user.id, updateUserDto);
    res.status(200).json(updatedUser);
  };

  uploadAvatar = async (req: TypedRequest, res: Response) => {
    const user = req.user!;
    const file = req.file!;

    const avatar: FileUpload = {
      buffer: file.buffer,
      originalname: file.originalname,
    };

    const media = await this.userService.uploadAvatar(user.id, avatar);

    res.status(201).json(media);
  };

  getAllAvatars = async (req: TypedRequest, res: Response) => {
    const user = req.user!;
    const avatars = await this.userService.getAllUserAvatars(user.id);
    res.status(200).json(avatars);
  };

  setMainAvatar = async (req: TypedRequest<{ params: { mediaId: number } }>, res: Response) => {
    const user = req.user!;
    const { mediaId } = req.validated.params;

    const updatedAvatar = await this.userService.setUserMainAvatar(user.id, mediaId);
    res.status(200).json(updatedAvatar);
  };

  deleteAvatar = async (req: TypedRequest<{ params: { mediaId: number } }>, res: Response) => {
    const user = req.user!;
    const { mediaId } = req.validated.params;

    const messageResponse = await this.userService.deleteUserAvatar(user.id, mediaId);
    res.status(200).json(messageResponse);
  };

  deleteMe = async (req: TypedRequest, res: Response) => {
    const user = req.user!;
    const messageResponse = await this.userService.delete(user.id);
    res.status(200).json(messageResponse);
  };
}
