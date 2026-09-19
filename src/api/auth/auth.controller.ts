import { Request, Response } from "express";
import { SignInRequest } from "./auth.types";
import * as Service from "./auth.service";
import { AuthenticatedRequest } from "@shared/types/auth";

export async function signIn(req: Request, res: Response) {
  const userInfo = req.body as SignInRequest;
  const user = await Service.signIn(userInfo);
  if(!user) {
    return res.status(404).json({ message: "Failed to sign in" });
  }
  return res.status(200).json(user);
};

export async function role(req: AuthenticatedRequest, res: Response) {
  const role = await Service.role(req.user.id);
  return res.status(200).json(role);
};
