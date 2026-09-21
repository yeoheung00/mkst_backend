import express, { Request, Response } from "express";
import { ApiError } from "src/shared/middlewares/error";
import prisma from "@shared/config/db-connection";

const searchRouter = express.Router();

searchRouter.get("/:searchTerm", searchController);

async function searchController(req: Request, res: Response) {
  const params = req.params.searchTerm as string;
  const searchTerm = params.trim();
  if (!searchTerm)
    throw new ApiError(400, "BAD_REQUEST", "searchTerm is required");
  const words = searchTerm.split(" ");
  const results = await searchService(words);
  if (!results) throw new ApiError(404, "NOT_FOUND", "No results found");
  res.status(200).json(results);
}

async function searchService(words: string[]) {
  const postWhere = {
    AND: words.map((word) => ({
      OR: [
        { title: { contains: word, mode: "insensitive" as const } },
        { summary: { contains: word, mode: "insensitive" as const } },
      ],
    })),
  };
  return await prisma.post.findMany({
    where: postWhere,
    select: {
      slug: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      }
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
}

export default searchRouter;
