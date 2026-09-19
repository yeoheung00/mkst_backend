import type {
  RequestHandler,
  Response,
  NextFunction,
} from "express";

import type { AuthenticatedRequest } from "@shared/types/auth";

export const authenticatedHandler = (
  handler: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return handler as RequestHandler;
};
