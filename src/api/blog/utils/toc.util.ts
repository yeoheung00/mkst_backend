import { TocItem } from '../blog.types';

const getHeadingText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return '';
  const obj = node as Record<string, unknown>;
  if (typeof obj.text === 'string') return obj.text;
  if (Array.isArray(obj.content)) {
    return obj.content.map(getHeadingText).join('');
  }
  return '';
}

const extractToc = (node: unknown): TocItem[] => {
  const toc: TocItem[] = [];
  function traverse(currentNode: unknown) {
    if (!currentNode || typeof currentNode !== 'object') return;
    if (Array.isArray(currentNode)) {
      currentNode.forEach(traverse);
      return;
    }
    const obj = currentNode as Record<string, unknown>;
    const type = typeof obj.type === 'string' ? obj.type.toLowerCase() : '';
    const attrs = (obj.attrs as Record<string, unknown>) || {};
    if (type === 'heading') {
      const level = (attrs.level ?? 2) as 2 | 3;
      const id = typeof attrs.id === 'string' ? attrs.id.trim() : '';
      const text = getHeadingText(obj).trim();
      if (level && id && text) toc.push({ id, level, text });
      return;
    }
    if (Array.isArray(obj.content)) traverse(obj.content);
  }
  let parsed = node;
  if (typeof node === 'string') {
    try {
      parsed = JSON.parse(node);
    } catch {
      return [];
    }
  }
  traverse(parsed);
  return toc;
}

export default extractToc;
