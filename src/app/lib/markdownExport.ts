import { ContentBlock } from '../types';

const escapeMarkdown = (text: string): string => {
  return text;
};

const convertBlockToMarkdown = (block: ContentBlock): string => {
  switch (block.type) {
    case 'heading': {
      const level = block.metadata?.level ?? 2;
      const hashes = '#'.repeat(level);
      return `${hashes} ${block.content}`;
    }

    case 'paragraph':
      return escapeMarkdown(block.content);

    case 'quote':
      return block.content
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');

    case 'divider':
      return '---';

    case 'linebreak':
      return '<br/>';

    case 'list': {
      const isOrdered = block.metadata?.listStyle === 'ordered';
      return block.content
        .split('\n')
        .filter(Boolean)
        .map((item, i) => (isOrdered ? `${i + 1}. ${item}` : `- ${item}`))
        .join('\n');
    }

    case 'checklist':
      return block.content
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^\[(x|X|\s)\]\s*(.+)$/);
          if (!match) return `- [ ] ${line}`;
          const checked = match[1].toLowerCase() === 'x';
          return `- [${checked ? 'x' : ' '}] ${match[2]}`;
        })
        .join('\n');

    case 'table': {
      const rows = block.content.split('\n').filter(Boolean);
      if (rows.length === 0) return '';
      const header = rows[0];
      const cols = header.split('|').map((c) => c.trim());
      const separator = cols.map(() => '---').join(' | ');
      const headerLine = cols.join(' | ');
      const dataLines = rows.slice(1).join('\n');
      return `${headerLine}\n${separator}\n${dataLines}`;
    }

    case 'link': {
      const url = block.metadata?.url ?? '';
      const text = block.content || url;
      return `[${text}](${url})`;
    }

    case 'image': {
      const url = block.metadata?.url ?? '';
      const alt = block.metadata?.alt ?? block.content ?? '';
      return `![${alt}](${url})`;
    }

    case 'code': {
      const lang = block.metadata?.language ?? '';
      return `\`\`\`${lang}\n${block.content}\n\`\`\``;
    }

    case 'interactive': {
      const lang = block.metadata?.language ?? 'jsx';
      return `\`\`\`interactive ${lang}\n${block.content}\n\`\`\``;
    }

    case 'iframe': {
      const url = block.metadata?.url ?? '';
      const title = block.metadata?.title ?? block.content ?? '';
      const height = block.metadata?.height ?? 420;
      return `<iframe src="${url}" title="${title}" height="${height}" allowfullscreen></iframe>`;
    }

    case 'callout': {
      const variant = block.metadata?.variant ?? 'info';
      return `> [!${variant.toUpperCase()}]\n> ${block.content}`;
    }

    case 'math':
      return `$$\n${block.content}\n$$`;

    default:
      return block.content ?? '';
  }
};

export const exportContentToMarkdown = (title: string, content: ContentBlock[]): string => {
  const lines: string[] = [];

  if (title.trim()) {
    lines.push(`# ${title.trim()}`);
    lines.push('');
  }

  for (const block of content) {
    const md = convertBlockToMarkdown(block);
    if (md !== '') {
      lines.push(md);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
};

export const downloadMarkdown = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'export'}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
