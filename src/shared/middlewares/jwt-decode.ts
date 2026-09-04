import { Response, NextFunction, Request } from "express";
import { jwtVerify } from "jose";


const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = { id: null, isSignedIn: false };
      console.log("토큰 없음.");
      return next();
    }

    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) {
      console.error("❌ Express 서버의 JWT_SECRET 환경변수가 설정되지 않았습니다.");
      req.user = { id: null, isSignedIn: false };
      return next();
    }

    const secret = new TextEncoder().encode(rawSecret);
    const { payload } = await jwtVerify(token, secret);

    req.user = {
      id: (payload.sub as string) ?? null,
      isSignedIn: true,
    };
    console.log("토큰 인증 성공:", req.user);


    return next();
  } catch (error) {
    req.user = { id: null, isSignedIn: false };
    console.log("로그인 미인증:", error instanceof Error ? error.message : error);
    return next();
  }
};

export default authenticateJWT;
