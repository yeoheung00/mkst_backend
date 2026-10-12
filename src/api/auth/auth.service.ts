import prisma from "@shared/config/db-connection";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@shared/util/jwt.util";3
import axios from "axios";
import { KakaoTokenResponse, KakaoUserResponse } from "./auth.types";


export const processKakaoLogin = async (code: string, userAgent?: string) => {
  // 1. 카카오 OAuth 토큰 발급
  const tokenResponse = await axios.post<KakaoTokenResponse>(
    'https://kauth.kakao.com/oauth/token',
    null,
    {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    }
  );

  const { access_token: kakaoAccessToken } = tokenResponse.data;

  // 2. 카카오 사용자 프로필 조회
  const userResponse = await axios.get<KakaoUserResponse>(
    'https://kapi.kakao.com/v2/user/me',
    {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    }
  );

  const kakaoData = userResponse.data;
  console.log(kakaoData);
  const kakaoId = String(kakaoData.id);
  const nickname = kakaoData.kakao_account?.profile?.nickname ?? 'Kakao User';
  const profileImage = kakaoData.kakao_account?.profile?.profile_image_url ?? null;
  const email = kakaoData.kakao_account?.email ?? null;

  // 3. User Upsert (기존 회원이면 정보 갱신, 신규 회원이면 생성)
  const user = await prisma.user.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'kakao',
        providerAccountId: kakaoId,
      },
    },
    update: {
      name: nickname,
      image: profileImage,
    },
    create: {
      provider: 'kakao',
      providerAccountId: kakaoId,
      email,
      name: nickname,
      image: profileImage,
    },
  });

  // 4. 서비스 자체 Access Token (15분) 및 Refresh Token (14일) 발급
  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = await signAccessToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);

  // 5. DB RefreshToken 테이블에 세션 저장 (14일 만료)
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshUserTokens = async (currentToken: string, userAgent?: string) => {
  // 1. JWT 서명 및 유효기간 검증
  const payload = await verifyRefreshToken(currentToken);

  // 2. DB에 실제 존재하는 토큰인지 확인
  const savedToken = await prisma.refreshToken.findUnique({
    where: { token: currentToken },
  });

  // DB에 없거나 이미 만료된 경우 (재사용 시도이거나 유효하지 않은 세션)
  if (!savedToken || savedToken.expiresAt < new Date()) {
    if (savedToken) {
      await prisma.refreshToken.delete({ where: { id: savedToken.id } });
    }
    throw new Error('INVALID_TOKEN');
  }

  // 3. 새 Access Token & Refresh Token 생성
  const tokenPayload = { userId: payload.userId, role: payload.role };
  const newAccessToken = await signAccessToken(tokenPayload);
  const newRefreshToken = await signRefreshToken(tokenPayload);

  // 4. RTR: 기존 토큰 삭제 및 신규 토큰 생성 (트랜잭션)
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: savedToken.id } }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.userId,
        userAgent: userAgent ?? null,
        expiresAt,
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * 로그아웃: DB의 Refresh Token 레코드 제거
 */
export const revokeRefreshToken = async (token: string) => {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
};
