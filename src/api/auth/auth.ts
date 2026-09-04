import { Request, Response } from "express"
import prisma from "src/shared/config/db-connection";
import express from "express";
import { SignInRequest } from "./auth.types";

const authRouter = express.Router();

authRouter.post('/signin', signIn);

async function signIn(req: Request, res: Response) {
  const { name, email, image, provider, providerAccountId } = req.body as SignInRequest;
  try {
    const user = await prisma.user.upsert({
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
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export default authRouter;
