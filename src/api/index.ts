
import { Router } from "express";
import authRouter from "./auth/auth.router";
import blogRouter from "./blog/blog.router";
import searchRouter from "./search";
import uploadRouter from "./upload/upload.router";
import { errorMiddleware } from "@shared/middlewares/error";

const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/blog", blogRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/upload", uploadRouter);
apiRouter.use(errorMiddleware);
export default apiRouter;
