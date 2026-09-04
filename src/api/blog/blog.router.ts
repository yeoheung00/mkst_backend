import express from "express";
import { createPost, getCategories, getPosts, getPostBySlug, getCategoryBySlug } from "./blog.controller";

const blogRouter = express.Router();

blogRouter.get("/categories", getCategories);
blogRouter.get("/category/:slug", getCategoryBySlug);
blogRouter.get("/posts", getPosts);
blogRouter.post("/posting", createPost);
blogRouter.get("/post/:slug", getPostBySlug);

export default blogRouter;
