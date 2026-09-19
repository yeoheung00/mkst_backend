import type { Request } from "express";

export type AnonymousUser = {
  id: null;
  isSignedIn: false;
};

export type AuthenticatedUser = {
  id: string;
  isSignedIn: true;
};

export type RequestUser = AnonymousUser | AuthenticatedUser;

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
