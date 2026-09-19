import 'express';
import { RequestUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user: RequestUser;
    }
  }
}
