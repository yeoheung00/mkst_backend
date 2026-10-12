import { Request, Response } from "express";
import * as Service from "./auth.service";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "./auth.util";

export const kakaoCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: '인가 코드가 전달되지 않았습니다.' });
  }

  try {
    const userAgent = req.headers['user-agent'];

    // 1. 카카오 인증 및 토큰 발급/DB 저장
    const { accessToken, refreshToken } = await Service.processKakaoLogin(code, userAgent);

    // 2. Refresh Token을 HttpOnly 쿠키로 설정
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    // 3. 프론트엔드로 리다이렉트
    // (Access Token은 URL query parameter 또는 별도 핸들러로 전달)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (error: any) {
    console.error('카카오 로그인 처리 실패:', error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
  }
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!currentToken) {
    return res.status(401).json({ message: 'Refresh token이 없습니다.' });
  }

  try {
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken } = await Service.refreshUserTokens(currentToken, userAgent);

    // 새 Refresh Token으로 쿠키 교체
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    // 새 Access Token은 JSON 응답 본문으로 전달
    return res.status(200).json({ accessToken });
  } catch (error) {
    // 검증 실패 시 기존 쿠키 정리
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    return res.status(401).json({ message: '세션이 만료되었거나 유효하지 않습니다.' });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (currentToken) {
    await Service.revokeRefreshToken(currentToken);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
  return res.status(200).json({ message: '로그아웃되었습니다.' });
};
