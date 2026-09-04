import prisma from "@shared/config/db-connection";
import { CreatePostInput } from "./blog.types";
import { Prisma } from "@generated/prisma/client";
import extractToc from "./utils/toc.util";
import { toSlug } from "./utils";

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: {
      slug,
    },
  });
}

export async function getPosts(categorySlug?: string) {
  return await prisma.post.findMany({
    where: categorySlug ? { category: { slug: categorySlug } } : undefined,
    select: {
      id: true,
      slug: true,
      category: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      images: {
        where: {
          displayOrder: 0,
        },
        select: {
          url: true,
          width: true,
          height: true,
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getPostBySlug(slug: string) {
  return await prisma.post.findUnique({
    where: {
      slug,
    },
    select: {
      category: {
        select: {
          name: true,
        }
      },
      title: true,
      toc: true,
      content: true,
      images: true,
      createdAt: true,
      updatedAt: true,
      comments: true,
      _count: {
        select: { likes: true },
      },
    },
  });
}

export async function createPost(post: CreatePostInput, authorId: string) {
  const { categoryName, content, images, ...input } = post;
  const toc = extractToc(content);
  const randomUUID = crypto.randomUUID().slice(0, 4);
  const slug = toSlug(input.title);
  return await prisma.post.create({
    data: {
      ...input,
      slug: `${slug}-${randomUUID}`,
      toc: toc as unknown as Prisma.InputJsonValue,
      content: content as unknown as Prisma.InputJsonValue,
      author: {
        connect: { id: authorId },
      },
      category: {
        connectOrCreate: {
          where: { name: categoryName },
          create: {
            slug: toSlug(categoryName),
            name: categoryName
          },
        },
      },
      ...(images.length > 0 && {
        images: {
          createMany: {
            data: images.map((image, index) => ({
              url: image.url,
              width: image.width,
              height: image.height,
              displayOrder: index,
            })),
          }
      }}),
    },
    select: {
      slug: true,
      category: {
        select: {
          slug: true,
        },
      }
    }
  });
}
