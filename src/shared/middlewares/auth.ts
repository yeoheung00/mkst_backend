import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

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

export { optionalAuth, requireAuth };
