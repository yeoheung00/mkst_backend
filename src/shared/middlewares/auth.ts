import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import prisma from "@shared/config/db-connection";
import { verifyAccessToken } from "@shared/util/jwt.util";


export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  // 'Bearer <TOKEN>' 분리
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload // 라우트 핸들러에서 req.user.userId 사용 가능
    next();
  } catch (error) {
    // 토큰 만료 또는 변조 시 프론트엔드가 Silent Refresh를 시도하도록 401 반환
    return res.status(401).json({ message: '만료되었거나 유효하지 않은 토큰입니다.' });
  }
};