import { SignInRequest } from "./auth.types";
import prisma from "@shared/config/db-connection";

export async function signIn(userInfo: SignInRequest) {
  const { name, email, image, provider, providerAccountId } = userInfo;
  return await prisma.user.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: { name, email, image },
    create: {
      name,
      email,
      image,
      provider,
      providerAccountId,
    },
    select: {
      id: true,
      name: true,
      image: true,
    }
  });
}

export async function role(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
}
