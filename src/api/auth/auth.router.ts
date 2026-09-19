import { Request, Response } from "express"
import express from "express";
import { SignInRequest } from "./auth.types";
import { signIn, role } from "./auth.controller";
import { requireAuth } from "@shared/middlewares/auth";
import { authenticatedHandler } from "@shared/http/handler";

const authRouter = express.Router();

authRouter.post('/signin', signIn);
authRouter.get('/role', requireAuth, authenticatedHandler(role));

export default authRouter;
