
import * as Service from "./blog.service";
import { Request, Response } from "express";
import { CreateCommentInput, CreatePostInput } from "./blog.types";
import { AuthenticatedRequest } from "@shared/types/auth";

export async function getCategories(req: Request, res: Response) {
  const categories = await Service.getCategories();
  return res.status(200).json(categories);
}

export async function getCategoryBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const category = await Service.getCategoryBySlug(slug);
  if (!category) return res.status(404).json({ error: "카테고리를 가져오는 데 실패했습니다." });
  return res.status(200).json(category);
}

export async function getPosts(req: Request, res: Response) {
  const categorySlug = req.query.categorySlug as string;
  const posts = await Service.getPosts(categorySlug);
  return res.status(200).json(posts);
}

export async function createPost(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.id;
  if (!req.body) return res.status(400).json({ error: "요청 본문이 필요합니다." });
  const post = req.body as CreatePostInput;
  const result = await Service.createPost(post, authorId);
  return res.status(201).json(result);
}

export async function editPost(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.id;
  const postId = req.params.id as string;
  const post = req.body as CreatePostInput;
  const result = await Service.editPost(post, authorId, postId);
  return res.status(200).json(result);
}

export async function deletePost(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.id;
  const postId = req.params.id as string;
  const goto = await Service.deletePost(authorId, postId);
  return res.status(200).json({ goto });
}

export async function getPostBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const post = await Service.getPostBySlug(slug);
  if (!post) return res.status(404).json({ error: "포스트를 가져오는 데 실패했습니다." });
  return res.status(200).json(post);
}

export async function getComments(req: Request, res: Response) {
  const postId = req.params.postId as string;
  const comments = await Service.getComments(postId);
  return res.status(200).json(comments);
}

export async function createComment(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.id;
  const comment = req.body as CreateCommentInput;
  const result = await Service.createComment(comment, authorId);
  return res.status(201).json(result);
}

export async function editComment(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.id;
  const id = req.params.id as string;
  const comment = req.body as CreateCommentInput;
  await Service.editComment(id, comment.content, authorId);
  return res.status(204).send();
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.id;
  const id = req.params.id as string;
  const result = await Service.deleteComment(id, authorId);
  return res.status(200).json({deletedIds: result});
}
