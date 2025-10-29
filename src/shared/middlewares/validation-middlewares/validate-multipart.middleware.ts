import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

export const validateMultipartMiddleware = (schema: ZodType): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data: Record<string, unknown> = {
      ...(req.body as Record<string, unknown>),
    };

    if (req.file) data.file = req.file;
    if (req.files) data.files = req.files;

    const parsed = schema.parse(data, { reportInput: true });

    req.validated = parsed;
    next();
  };
};
