import express from "express";
import { createPost, getCategories, getPosts, getPostBySlug, getCategoryBySlug, getComments, createComment, editComment, deleteComment, editPost, deletePost, likePost } from "./blog.controller";
import { authenticatedHandler } from "@shared/http/handler";
import { authenticateToken } from "src/shared/middlewares/auth";

const blogRouter = express.Router();

blogRouter.get("/categories", getCategories);
blogRouter.get("/category/:slug", getCategoryBySlug);
blogRouter.get("/posts", getPosts);
blogRouter.post("/posting", authenticateToken, authenticatedHandler(createPost));
blogRouter.patch("/posting/:id", authenticateToken, authenticatedHandler(editPost));
blogRouter.delete("/posting/:id", authenticateToken, authenticatedHandler(deletePost));
blogRouter.get("/post/:slug", getPostBySlug);
blogRouter.post("/post/:id/like", authenticateToken, authenticatedHandler(likePost));
blogRouter.get("/comments/:postId", getComments);
blogRouter.post("/comment", authenticateToken, authenticatedHandler(createComment));
blogRouter.patch("/comment/:id", authenticateToken, authenticatedHandler(editComment));
blogRouter.delete("/comment/:id", authenticateToken, authenticatedHandler(deleteComment));


export default blogRouter;
