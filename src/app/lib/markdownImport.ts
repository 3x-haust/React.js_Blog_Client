import { ContentBlock } from '../types';

export interface ParsedMarkdownImport {
  title: string;
  tags: string[];
  thumbnail: string;
  content: ContentBlock[];
}

interface FrontmatterData {
  title?: string;
  tags?: string[];
  thumbnail?: string;
}

const createBlockId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createParagraphBlock = (lines: string[]): ContentBlock | null => {
  const content = lines.join('\n').trim();
  if (!content) {
    return null;
  }

  return {
    id: createBlockId(),
    type: 'paragraph',
    content,
  };
};

const parseFenceMeta = (info: string): { type: 'code' | 'interactive'; language: string } => {
  const tokens = info.split(/\s+/).filter(Boolean);
  const first = tokens[0] ?? 'text';

  if (first === 'interactive') {
    return { type: 'interactive', language: tokens[1] ?? 'jsx' };
  }

  return {
    type: tokens.includes('type=interactive') ? 'interactive' : 'code',
    language: first,
  };
};

const isChecklistLine = (line: string): boolean => {
  return /^[-*+]\s+\[( |x|X)\]\s+/.test(line.trim());
};

const isUnorderedListLine = (line: string): boolean => {
  return /^[-*+]\s+/.test(line.trim()) && !isChecklistLine(line);
};

const isOrderedListLine = (line: string): boolean => {
  return /^\d+\.\s+/.test(line.trim());
};

const isTableSeparatorLine = (line: string): boolean => {
  const trimmed = line.trim();
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed);
};

const splitTableCells = (line: string): string[] => {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
};

const extractIframeAttribute = (html: string, attribute: string): string | null => {
  const regex = new RegExp(`${attribute}\\s*=\\s*[\"']([^\"']+)[\"']`, 'i');
  const match = html.match(regex);
  return match?.[1] ?? null;
};

const parseInlineListValue = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  return trimmed
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
};

const parseFrontmatter = (
  markdown: string,
): { frontmatter: FrontmatterData; body: string } => {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized };
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { frontmatter: {}, body: normalized };
  }

  const header = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5);
  const frontmatter: FrontmatterData = {};

  const lines = header.split('\n');
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    index += 1;

    if (!line || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('tags:')) {
      const inlineValue = line.slice('tags:'.length).trim();
      if (inlineValue) {
        frontmatter.tags = parseInlineListValue(inlineValue);
      } else {
        const listValues: string[] = [];
        while (index < lines.length) {
          const next = lines[index].trim();
          if (!next.startsWith('- ')) {
            break;
          }
          listValues.push(next.slice(2).trim().replace(/^['"]|['"]$/g, ''));
          index += 1;
        }
        frontmatter.tags = listValues.filter(Boolean);
      }
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key === 'title') {
      frontmatter.title = value;
    }

    if (key === 'thumbnail') {
      frontmatter.thumbnail = value;
    }
  }

  return { frontmatter, body };
};

export const parseMarkdownToEditorContent = (rawMarkdown: string): ParsedMarkdownImport => {
  const { frontmatter, body } = parseFrontmatter(rawMarkdown);
  const markdown = body;
  const lines = markdown.split('\n');
  const blocks: ContentBlock[] = [];

  let index = 0;
  let parsedTitle = '';

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const rawLevel = headingMatch[1].length;
      const level = (rawLevel > 3 ? 3 : rawLevel) as 1 | 2 | 3;
      const headingContent = headingMatch[2].trim();

      if (!parsedTitle && level === 1) {
        parsedTitle = headingContent;
      }

      blocks.push({
        id: createBlockId(),
        type: 'heading',
        content: headingContent,
        metadata: { level },
      });
      index += 1;
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({
        id: createBlockId(),
        type: 'divider',
        content: '',
      });
      index += 1;
      continue;
    }

    const imageMatch = /^!\[(.*?)\]\((.*?)\)$/.exec(trimmed);
    if (imageMatch) {
      blocks.push({
        id: createBlockId(),
        type: 'image',
        content: imageMatch[1].trim(),
        metadata: {
          alt: imageMatch[1].trim(),
          url: imageMatch[2].trim(),
        },
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('<iframe')) {
      const iframeLines: string[] = [trimmed];

      while (index + 1 < lines.length && !iframeLines[iframeLines.length - 1].includes('</iframe>')) {
        index += 1;
        iframeLines.push(lines[index].trim());
      }

      const iframeHtml = iframeLines.join(' ');
      const src = extractIframeAttribute(iframeHtml, 'src') ?? '';
      const title = extractIframeAttribute(iframeHtml, 'title') ?? '';
      const rawHeight = extractIframeAttribute(iframeHtml, 'height');
      const parsedHeight = rawHeight ? Number(rawHeight) : NaN;

      blocks.push({
        id: createBlockId(),
        type: 'iframe',
        content: title,
        metadata: {
          url: src,
          title,
          height: Number.isFinite(parsedHeight) ? Math.max(160, Math.floor(parsedHeight)) : 420,
        },
      });

      index += 1;
      continue;
    }

    const linkMatch = /^\[(.+?)\]\((.+?)\)$/.exec(trimmed);
    if (linkMatch) {
      blocks.push({
        id: createBlockId(),
        type: 'link',
        content: linkMatch[1].trim(),
        metadata: {
          url: linkMatch[2].trim(),
        },
      });
      index += 1;
      continue;
    }

    if (isChecklistLine(trimmed)) {
      const rows: string[] = [];
      while (index < lines.length && isChecklistLine(lines[index])) {
        const normalized = lines[index]
          .trim()
          .replace(/^[-*+]\s+\[( |x|X)\]\s+/, (_, mark: string) =>
            mark.toLowerCase() === 'x' ? '[x] ' : '[ ] ',
          );
        rows.push(normalized);
        index += 1;
      }

      blocks.push({
        id: createBlockId(),
        type: 'checklist',
        content: rows.join('\n'),
      });
      continue;
    }

    if (isUnorderedListLine(trimmed) || isOrderedListLine(trimmed)) {
      const ordered = isOrderedListLine(trimmed);
      const rows: string[] = [];

      while (
        index < lines.length &&
        (ordered ? isOrderedListLine(lines[index]) : isUnorderedListLine(lines[index]))
      ) {
        rows.push(
          lines[index]
            .trim()
            .replace(ordered ? /^\d+\.\s+/ : /^[-*+]\s+/, ''),
        );
        index += 1;
      }

      blocks.push({
        id: createBlockId(),
        type: 'list',
        content: rows.join('\n'),
        metadata: {
          listStyle: ordered ? 'ordered' : 'unordered',
        },
      });
      continue;
    }

    if (
      trimmed.includes('|') &&
      index + 1 < lines.length &&
      isTableSeparatorLine(lines[index + 1])
    ) {
      const header = splitTableCells(lines[index]);
      index += 2;

      const rows: string[] = [header.join(' | ')];
      while (index < lines.length) {
        const rowLine = lines[index].trim();
        if (!rowLine || !rowLine.includes('|')) {
          break;
        }
        rows.push(splitTableCells(rowLine).join(' | '));
        index += 1;
      }

      blocks.push({
        id: createBlockId(),
        type: 'table',
        content: rows.join('\n'),
      });
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const quoteLine = lines[index].trim();
        if (!quoteLine.startsWith('>')) {
          break;
        }
        quoteLines.push(quoteLine.replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push({
        id: createBlockId(),
        type: 'quote',
        content: quoteLines.join('\n').trim(),
      });
      continue;
    }

    const fenceMatch = /^```(.*)$/.exec(trimmed);
    if (fenceMatch) {
      const fenceInfo = parseFenceMeta(fenceMatch[1].trim());
      index += 1;

      const codeLines: string[] = [];
      while (index < lines.length && !/^```\s*$/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        id: createBlockId(),
        type: fenceInfo.type,
        content: codeLines.join('\n').trimEnd(),
        metadata:
          fenceInfo.type === 'interactive'
            ? { language: fenceInfo.language, editable: true }
            : { language: fenceInfo.language || 'text' },
      });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const next = lines[index];
      const nextTrimmed = next.trim();
      if (
        !nextTrimmed ||
        /^(#{1,6})\s+/.test(nextTrimmed) ||
        nextTrimmed === '---' ||
        nextTrimmed === '***' ||
        /^```/.test(nextTrimmed) ||
        /^>/.test(nextTrimmed) ||
        /^!\[(.*?)\]\((.*?)\)$/.test(nextTrimmed) ||
        /^\[(.+?)\]\((.+?)\)$/.test(nextTrimmed) ||
        isChecklistLine(nextTrimmed) ||
        isUnorderedListLine(nextTrimmed) ||
        isOrderedListLine(nextTrimmed) ||
        (nextTrimmed.includes('|') &&
          index + 1 < lines.length &&
          isTableSeparatorLine(lines[index + 1]))
      ) {
        break;
      }

      paragraphLines.push(next);
      index += 1;
    }

    const paragraph = createParagraphBlock(paragraphLines);
    if (paragraph) {
      blocks.push(paragraph);
    }
  }

  return {
    title: frontmatter.title?.trim() || parsedTitle,
    tags: frontmatter.tags ?? [],
    thumbnail: frontmatter.thumbnail?.trim() ?? '',
    content: blocks,
  };
};
