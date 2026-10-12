// src/api/user/user.router.ts
import { Router } from 'express';
import { getMe } from './user.controller';
import { authenticateToken } from '@shared/middlewares/auth';

const userRouter = Router();

// GET /api/user/me
userRouter.get('/me', authenticateToken as any, getMe as any);

export default userRouter;