import prisma from "@shared/config/db-connection";
import { CreatePostInput, CreateCommentInput } from "./blog.types";
import { Prisma } from "@generated/prisma/client";
import extractToc, { processContentWithToc } from "./utils/toc.util";
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
  
  // TOC 및 ID가 주입된 본문 추출
  const { content: processedContent, toc } = processContentWithToc(content);
  const randomUUID = crypto.randomUUID().slice(0, 4);
  const slug = toSlug(input.title);

  return await prisma.post.create({
    data: {
      ...input,
      slug: `${slug}-${randomUUID}`,
      toc: toc as unknown as Prisma.InputJsonValue,
      content: processedContent as unknown as Prisma.InputJsonValue,
      author: { connect: { id: authorId } },
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
      category: { select: { slug: true } }
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
      author: { select: { id: true } },
      images: { select: { url: true } },
      category: { select: { id: true, name: true } }, // name 추가 권장
    },
  });

  if (!postToUpdate) throw new ApiError(404, 'NOT_FOUND', 'Post not found');
  if (postToUpdate.author.id !== authorId) {
    throw new ApiError(403, 'FORBIDDEN', 'You are not authorized to edit this post');
  }

  const { categoryName, content, images, ...input } = post;

  // [수정 1] createPost와 동일하게 processContentWithToc 사용 (TOC & ID 주입 일관성)
  const { content: processedContent, toc } = processContentWithToc(content);

  const existingImageUrls = new Set(postToUpdate.images.map((img) => img.url));
  const newImageUrls = new Set(images.map((img) => img.url));

  const imagesToDelete = postToUpdate.images.filter((img) => !newImageUrls.has(img.url));
  const imagesToCreate = images.filter((img) => !existingImageUrls.has(img.url));
  
  // [수정 4를 위한 세팅] 기존에 있었고, 여전히 남아있는 이미지만 업데이트 대상
  const imagesToUpdate = images.filter((img) => existingImageUrls.has(img.url));

  const oldCategoryId = postToUpdate.category.id;

  return await prisma.$transaction(async (tx) => {
    // 1. Post 수정
    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: {
        ...input,
        // [수정 3] slug 업데이트 제거 - 기존 URL 보존 (SEO 최적화)
        toc: toc as unknown as Prisma.InputJsonValue,
        content: processedContent as unknown as Prisma.InputJsonValue,
        // 카테고리 업데이트 (이름이 변경되었을 경우 새로운 곳에 연결)
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
        category: { select: { slug: true } },
      },
    });

    // 2. 삭제된 이미지 삭제
    if (imagesToDelete.length > 0) {
      await tx.postImage.deleteMany({
        where: {
          postId,
          url: { in: imagesToDelete.map((img) => img.url) },
        },
      });
    }

    // 3. 새로 추가된 이미지 생성
    if (imagesToCreate.length > 0) {
      await tx.postImage.createMany({
        data: imagesToCreate.map((image) => ({
          postId,
          url: image.url,
          width: image.width,
          height: image.height,
          displayOrder: images.findIndex((item) => item.url === image.url), // 전체 배열 기준 인덱스
        })),
      });
    }

    // 4. 기존 유지된 이미지들의 메타데이터(순서, 크기) 갱신 [수정 4 반영]
    if (imagesToUpdate.length > 0) {
      await Promise.all(
        imagesToUpdate.map((image) =>
          tx.postImage.updateMany({
            where: { postId, url: image.url },
            data: {
              displayOrder: images.findIndex((item) => item.url === image.url),
              width: image.width,
              height: image.height,
            },
          })
        )
      );
    }

    // 5. [수정 2] 빈 카테고리 정리 (이미지 블록 밖으로 분리)
    // 현재 포스트가 다른 카테고리로 이동했다면, 구 카테고리에 남은 글이 있는지 확인
    const oldCategoryCount = await tx.category.findUnique({
      where: { id: oldCategoryId },
      include: { _count: { select: { posts: true } } },
    });

    if (oldCategoryCount && oldCategoryCount._count.posts === 0) {
      await tx.category.delete({ where: { id: oldCategoryId } });
    }

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
