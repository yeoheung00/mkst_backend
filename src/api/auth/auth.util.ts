import { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // 자바스크립트(XSS) 접근 차단
  secure: process.env.NODE_ENV === 'production', // 프로덕션(HTTPS) 환경에서만 전송
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 도메인이 서로 다를 경우(CORS) 'none', 동일 도메인 프록시면 'lax'
  path: '/',
  maxAge: 14 * 24 * 60 * 60 * 1000, // 14일 (밀리초)
};