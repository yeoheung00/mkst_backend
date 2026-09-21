import prisma from "@shared/config/db-connection";
import { CreatePostInput, CreateCommentInput } from "./blog.types";
import { Prisma } from "@generated/prisma/client";
import extractToc from "./utils/toc.util";
import { toSlug } from "./utils";
import { ApiError } from "@shared/middlewares/error";

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

export async function getPosts(categorySlug: string) {
  return await prisma.post.findMany({
    where: categorySlug === "all" ? undefined : { category: { slug: categorySlug } },
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
      id: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
      category: {
        select: {
          name: true,
        }
      },
      title: true,
      toc: true,
      content: true,
      images: {
        select: {
          url: true,
          width: true,
          height: true,
        }
      },
      likes: {
        select: {
          userId: true,
        }
      },
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createPost(post: CreatePostInput, authorId: string) {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  if (user.role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "You do not have permission to create a post");

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

export async function editPost(
  post: CreatePostInput,
  authorId: string,
  postId: number
) {
  const postToUpdate = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      author: {
        select: {
          id: true,
        },
      },
      images: {
        select: {
          url: true,
        },
      },
      category: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!postToUpdate) {
    throw new ApiError(404, 'NOT_FOUND', 'Post not found');
  }

  if (postToUpdate.author.id !== authorId) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'You are not authorized to edit this post'
    );
  }

  const { categoryName, content, images, ...input } = post;

  const toc = extractToc(content);
  const randomUUID = crypto.randomUUID().slice(0, 4);
  const slug = toSlug(input.title);

  // 기존 DB 이미지
  const existingImageUrls = new Set(
    postToUpdate.images.map((image) => image.url)
  );

  // 수정된 게시글에 포함된 이미지
  const newImageUrls = new Set(
    images.map((image) => image.url)
  );

  // DB에는 있지만 수정된 게시글에는 없는 이미지
  const imagesToDelete = postToUpdate.images.filter(
    (image) => !newImageUrls.has(image.url)
  );

  // 수정된 게시글에는 있지만 DB에는 없는 이미지
  const imagesToCreate = images.filter(
    (image) => !existingImageUrls.has(image.url)
  );

  const categoryId = postToUpdate.category.id;

  return await prisma.$transaction(async (tx) => {
    // 1. Post 수정
    const updatedPost = await tx.post.update({
      where: { id: postId },
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
              name: categoryName,
            },
          },
        },
      },
      select: {
        slug: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    });

    // 2. 삭제된 이미지의 PostImage 삭제
    if (imagesToDelete.length > 0) {
      await tx.postImage.deleteMany({
        where: {
          postId,
          url: {
            in: imagesToDelete.map((image) => image.url),
          },
        },
      });
    }

    // 3. 새로 추가된 이미지의 PostImage 생성
    if (imagesToCreate.length > 0) {
      await tx.postImage.createMany({
        data: imagesToCreate.map((image) => ({
          postId,
          url: image.url,
          width: image.width,
          height: image.height,
          displayOrder: images.findIndex(
            (item) => item.url === image.url
          ),
        })),
      });

      const category = await tx.category.findUnique({
        where: { id: categoryId },
        select: {
          posts: true,
        },
      });
      if (category && category.posts.length === 0) {
        await tx.category.delete({
          where: { id: categoryId },
        });
      }
    }

    // 4. 기존 이미지들의 displayOrder도 갱신
    await Promise.all(
      images.map((image, index) =>
        tx.postImage.updateMany({
          where: {
            postId,
            url: image.url,
          },
          data: {
            displayOrder: index,
            width: image.width,
            height: image.height,
          },
        })
      )
    );

    return updatedPost;
  });
}

export async function deletePost(authorId: string, postId: number) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");
  if (post.authorId !== authorId) throw new ApiError(403, "FORBIDDEN", "You are not the author of this post");

  const categoryId = post.categoryId;

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  if (!categoryId) return "/blog";
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      posts: true,
    },
  });
  if (category && category.posts.length > 0) {
    return `/blog/${category.slug}`
  } else {
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });
    return "/blog";
  }
}

export async function getComments(postId: number) {
  return await prisma.comment.findMany({
    where: {
      postId,
    },
    select: {
      id: true,
      content: true,
      parentId: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createComment(comment: CreateCommentInput, authorId: string) {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

  const { postId, content, parentId } = comment;
  return await prisma.comment.create({
    data: {
      postId,
      authorId,
      content,
      parentId,
    },
    select: {
      id: true,
    },
  });
}

export async function editComment(id: number, content: string, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, "NOT_FOUND", "Comment not found");
  if (comment.authorId !== authorId) throw new ApiError(403, "FORBIDDEN", "You are not the author of this comment");

  await prisma.comment.update({
    where: { id },
    data: {
      content,
    },
  });
}

export async function deleteComment(id: number, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, "NOT_FOUND", "Comment not found");
  if (comment.authorId !== authorId) throw new ApiError(403, "FORBIDDEN", "You are not the author of this comment");

  const deletedIds: number[] = [];

  const deleteDeletedParents = async (
    tx: Prisma.TransactionClient,
    id: number,
  ): Promise<void> => {
    const comment = await tx.comment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        parentId: true,
        deletedAt: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment || !comment.deletedAt || comment._count.replies > 0) {
      return;
    }

    await tx.comment.delete({
      where: {
        id,
      },
    });

    deletedIds.push(id);

    if (comment.parentId) {
      await deleteDeletedParents(tx, comment.parentId);
    }
  };

  await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        parentId: true,
        deletedAt: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    if (comment._count.replies > 0) {
      await tx.comment.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return;
    }

    await tx.comment.delete({
      where: {
        id,
      },
    });

    deletedIds.push(id);

    if (comment.parentId) {
      await deleteDeletedParents(tx, comment.parentId);
    }
  });

  return deletedIds;
}

export async function likePost(postId: number, userId: string) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  if (!post) {
    throw new ApiError(404, "NOT_FOUND", "포스트를 찾을 수 없습니다.");
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
    return;
  }

  await prisma.like.create({
    data: {
      postId,
      userId,
    },
  });
}
