import type { Request } from "express";
import { JWTPayload } from "node_modules/jose/dist/types";

export interface UserTokenPayload extends JWTPayload {
  userId: string;
  role: string;
}

export type AnonymousUser = {
  id: null;
};

export type AuthenticatedUser = {
  userId: string;
  role: string;
};

export type RequestUser = AnonymousUser | AuthenticatedUser;

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
