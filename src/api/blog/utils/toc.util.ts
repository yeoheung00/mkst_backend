// utils/toc.util.ts
import { TocItem } from '../blog.types';

export interface JSONContent {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  text?: string;
  [key: string]: unknown;
}

export interface ProcessedPostContent {
  content: JSONContent;
  toc: TocItem[];
}

export const generateSlug = (text: string): string => {
  return (
    text
      .trim()
      .toLowerCase()
      // \p{L}: 모든 언어의 문자 (한글, 영문, 한자, 일본어 등)
      // \p{N}: 모든 숫자
      // \s: 공백, -: 하이픈
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
};

export const getHeadingText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return '';
  const obj = node as Record<string, unknown>;
  if (typeof obj.text === 'string') return obj.text;
  if (Array.isArray(obj.content)) {
    return obj.content.map(getHeadingText).join('');
  }
  return '';
};

export const processContentWithToc = (node: unknown): ProcessedPostContent => {
  let parsed: unknown = node;
  if (typeof node === 'string') {
    try {
      parsed = JSON.parse(node);
    } catch {
      return { content: {}, toc: [] };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { content: {}, toc: [] };
  }

  const toc: TocItem[] = [];
  const idCounts = new Map<string, number>();

  function traverseAndProcess(currentNode: unknown): unknown {
    if (!currentNode || typeof currentNode !== 'object') {
      return currentNode;
    }

    if (Array.isArray(currentNode)) {
      return currentNode.map(traverseAndProcess);
    }

    const obj = currentNode as Record<string, unknown>;
    const type = typeof obj.type === 'string' ? obj.type.toLowerCase() : '';
    const clonedNode: JSONContent = { ...obj };

    if (type === 'heading') {
      const text = getHeadingText(obj).trim();
      const baseSlug = generateSlug(text);

      const count = idCounts.get(baseSlug) ?? 0;
      const uniqueId = count > 0 ? `${baseSlug}-${count}` : baseSlug;
      idCounts.set(baseSlug, count + 1);

      // level 추출 시 타입 단언의 거짓말 방지 및 기본값 보장
      const rawLevel = (obj.attrs as Record<string, unknown>)?.level;
      const level = typeof rawLevel === 'number' ? rawLevel : 2;

      clonedNode.attrs = {
        ...(obj.attrs as Record<string, unknown>),
        id: uniqueId,
      };

      // Heading의 자식 노드(Text, Marks 등)도 순회하도록 보장 (수정된 부분)
      if (Array.isArray(obj.content)) {
        clonedNode.content = obj.content.map(traverseAndProcess) as JSONContent[];
      }

      // H2, H3 레벨만 TOC에 포함하도록 안전장치 추가
      if (text && (level === 2 || level === 3)) {
        toc.push({
          id: uniqueId,
          level: level as 2 | 3,
          text,
        });
      }

      return clonedNode;
    }

    if (Array.isArray(obj.content)) {
      clonedNode.content = obj.content.map(traverseAndProcess) as JSONContent[];
    }

    return clonedNode;
  }

  const processedJSON = traverseAndProcess(parsed) as JSONContent;

  return {
    content: processedJSON,
    toc,
  };
};

export default processContentWithToc;