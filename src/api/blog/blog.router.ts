import express from "express";
import { createPost, getCategories, getPosts, getPostBySlug, getCategoryBySlug, getComments, createComment, editComment, deleteComment, editPost, deletePost } from "./blog.controller";
import { requireAuth } from "@shared/middlewares/auth";
import { authenticatedHandler } from "@shared/http/handler";

const blogRouter = express.Router();

blogRouter.get("/categories", getCategories);
blogRouter.get("/category/:slug", getCategoryBySlug);
blogRouter.get("/posts", getPosts);
blogRouter.post("/posting", requireAuth, authenticatedHandler(createPost));
blogRouter.patch("/posting/:id", requireAuth, authenticatedHandler(editPost));
blogRouter.delete("/posting/:id", requireAuth, authenticatedHandler(deletePost));
blogRouter.get("/post/:slug", getPostBySlug);
blogRouter.get("/comments/:postId", getComments);
blogRouter.post("/comment", requireAuth, authenticatedHandler(createComment));
blogRouter.patch("/comment/:id", requireAuth, authenticatedHandler(editComment));
blogRouter.delete("/comment/:id", requireAuth, authenticatedHandler(deleteComment));


export default blogRouter;
