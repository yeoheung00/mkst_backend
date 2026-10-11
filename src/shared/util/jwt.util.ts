import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { UserTokenPayload } from '@shared/types/auth';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'default_access_secret'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'
); 

/**
 * Access Token 발급 (15분)
 */
export const signAccessToken = async (payload: { userId: string; role: string }): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET);
};

/**
 * Refresh Token 발급 (14일)
 */
export const signRefreshToken = async (payload: { userId: string; role: string }): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(REFRESH_SECRET);
};

/**
 * Access Token 검증
 */
export const verifyAccessToken = async (token: string): Promise<UserTokenPayload> => {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as UserTokenPayload;
};

/**
 * Refresh Token 검증
 */
export const verifyRefreshToken = async (token: string): Promise<UserTokenPayload> => {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as UserTokenPayload;
};