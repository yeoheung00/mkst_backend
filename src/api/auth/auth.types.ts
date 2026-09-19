export interface SignInRequest {
  name: string;
  email: string | null;
  image: string;
  provider: string;
  providerAccountId: string;
}
