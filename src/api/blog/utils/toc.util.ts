// utils/toc.util.ts
import { TocItem } from '../blog.types';

// Tiptap/ProseMirror 표준 JSONContent 호환 인터페이스
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

// 1. 한국어/영문/숫자 지원 슬러그 생성 함수
export const generateSlug = (text: string): string => {
  return (
    text
      .trim()
      .toLowerCase()
      // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈 유지)
      .replace(/[^\w\s\uAC00-\uD7A3-]/g, '')
      // 공백 치환
      .replace(/\s+/g, '-')
      // 중복 하이픈 단일화
      .replace(/-+/g, '-')
      // 앞뒤 하이픈 정리
      .replace(/^-+|-+$/g, '') || 'section'
  );
};

// 2. 노드 내부 텍스트 재귀 추출 함수
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

/**
 * contentJSON을 순회하여:
 * 1. heading 노드에 텍스트 기반 고유 id(slug)를 attrs.id로 주입
 * 2. 해당 정보를 바탕으로 TocItem[] 목록을 추출
 */
export const processContentWithToc = (node: unknown): ProcessedPostContent => {
  // 문자열 JSON 처리 방어 로직
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

      // 동일 텍스트 헤딩 중복 방지 (slug, slug-1, slug-2...)
      const count = idCounts.get(baseSlug) ?? 0;
      const uniqueId = count > 0 ? `${baseSlug}-${count}` : baseSlug;
      idCounts.set(baseSlug, count + 1);

      const level = ((obj.attrs as Record<string, unknown>)?.level ?? 2) as 2 | 3;

      // attrs에 id 주입
      clonedNode.attrs = {
        ...(obj.attrs as Record<string, unknown>),
        id: uniqueId,
      };

      // 텍스트와 레벨이 존재하는 경우 TOC 배열에 추가
      if (text && level) {
        toc.push({
          id: uniqueId,
          level,
          text,
        });
      }

      return clonedNode;
    }

    // 자식 노드가 있다면 재귀적으로 복제 순회
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
