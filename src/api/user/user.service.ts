// src/api/user/user.service.ts
import prisma from "@shared/config/db-connection";

export const getCurrentUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true, // DB 컬럼명이 name인 경우 name: true로 변경
      image: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};