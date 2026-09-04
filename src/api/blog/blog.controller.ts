
import * as Service from "./blog.service";
import { Request, Response } from "express";
import { CreatePostInput } from "./blog.types";

export async function getCategories(req: Request, res: Response) {
  const categories = await Service.getCategories();
  if (!categories) return res.status(500).json({ error: "카테고리 목록을 가져오는 데 실패했습니다." });
  return res.status(200).json(categories);
}

export async function getCategoryBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const category = await Service.getCategoryBySlug(slug);
  if (!category) return res.status(500).json({ error: "카테고리를 가져오는 데 실패했습니다." });
  return res.status(200).json(category);
}

export async function getPosts(req: Request, res: Response) {
  const categorySlug = req.query.categorySlug as string | undefined;
  const posts = await Service.getPosts(categorySlug);
  if (!posts) return res.status(500).json({ error: "포스트 목록을 가져오는 데 실패했습니다." });
  return res.status(200).json(posts);
}

export async function createPost(req: Request, res: Response) {
  try {
    if (!req.user?.isSignedIn || !req.user?.id) {
      console.log("로그인 에러");
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const authorId = req.user.id;
    if (!req.body) return res.status(400).json({ error: "요청 본문이 필요합니다." });
    const post = req.body as CreatePostInput;
    const result = await Service.createPost(post, authorId);
    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}

export async function getPostBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const post = await Service.getPostBySlug(slug);
  if (!post) return res.status(500).json({ error: "포스트를 가져오는 데 실패했습니다." });
  return res.status(200).json(post);
}
