
import { Router } from "express";
import authRouter from "./auth/auth";
import blogRouter from "./blog/blog.router";
import uploadRouter from "./upload/upload.router";

const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/blog", blogRouter);
apiRouter.use("/upload", uploadRouter);

export default apiRouter;
