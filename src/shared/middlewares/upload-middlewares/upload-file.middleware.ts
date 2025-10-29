import type { RequestHandler } from 'express';

import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadFileMiddleware = (fieldName: string): RequestHandler => {
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  return upload.single(fieldName);
};
