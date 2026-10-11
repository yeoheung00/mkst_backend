export interface SignInRequest {
  name: string;
  email: string | null;
  image: string;
  provider: string;
  providerAccountId: string;
}

export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}

export interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}