import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | null;
        isSignedIn: boolean;
      };
    }
  }
}
