export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PostImage {
  url: string;
  width: number;
  height: number;
  displayOrder: number;
}

export type CreatePostInput = {
  title: string;
  summary: string;
  content: Record<string, unknown>;
  categoryName: string;
  images: PostImage[];
}

export type CreateCommentInput = {
  postId: string;
  content: string;
  parentId?: string | null;
}

export type EditCommentInput = {
  content: string;
}
