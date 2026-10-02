import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import prisma from "@shared/config/db-connection";

const verifyToken = async (token: string): Promise<string | null> => {
  const rawSecret = process.env.JWT_SECRET;

  if (!rawSecret) {
    throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }

  const secret = new TextEncoder().encode(rawSecret);
  const { payload } = await jwtVerify(token, secret);

  return (payload.sub as string) ?? null;
};

const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      req.user = {
        id: null,
        isSignedIn: false,
      };

      return next();
    }

    const userId = await verifyToken(token);

    if (userId) {
      req.user = {
        id: userId,
        isSignedIn: true,
      };
    } else {
      req.user = {
        id: null,
        isSignedIn: false,
      };
    }

    return next();
  } catch (error) {
    req.user = {
      id: null,
      isSignedIn: false,
    };

    console.log(
      "JWT 인증 실패:",
      error instanceof Error ? error.message : error
    );

    return next();
  }
};

const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "로그인이 필요합니다.",
      });
    }

    const userId = await verifyToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "유효하지 않은 인증 정보입니다.",
      });
    }

    req.user = {
      id: userId,
      isSignedIn: true,
    };

    return next();
  } catch (error) {
    console.log(
      "JWT 인증 실패:",
      error instanceof Error ? error.message : error
    );

    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "유효하지 않은 인증 정보입니다.",
    });
  }
};

const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. requireAuth 통과 여부 확인
    if (!req.user || !req.user.id || !req.user.isSignedIn) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "로그인이 필요합니다.",
      });
    }

    // 2. DB에서 유저 권한 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "존재하지 않는 사용자입니다.",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "관리자 권한이 필요합니다.",
      });
    }

    return next();
  } catch (error) {
    console.error(
      "Admin 인가 실패:",
      error instanceof Error ? error.message : error
    );
    return res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "권한 확인 중 서버 오류가 발생했습니다.",
    });
  }
};

const adminOnly = [requireAuth, requireAdmin];

export { optionalAuth, requireAuth, adminOnly };
