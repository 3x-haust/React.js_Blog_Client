import { ContentBlock } from '../types';
import { CodeBlock } from './CodeBlock';
import { LiveCodeBlock } from './LiveCodeBlock';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ContentRendererProps {
  content: ContentBlock[];
  hideReadOnlyInteractive?: boolean;
  plainReadOnlyInteractive?: boolean;
}

const markdownComponents: Components = {
  strong: ({ ...props }) => (
    <strong {...props} className="font-extrabold text-foreground" style={{ fontWeight: 800 }} />
  ),
  em: ({ ...props }) => (
    <em {...props} className="italic text-foreground/90" />
  ),
  p: ({ ...props }) => (
    <p {...props} className="m-0 leading-relaxed" />
  ),
  a: ({ ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline decoration-primary/70 decoration-2 underline-offset-4 hover:decoration-primary font-medium"
    />
  ),
  table: ({ ...props }) => (
    <div className="my-4 overflow-x-auto border border-border bg-card">
      <table {...props} className="w-full border-collapse text-sm" />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      {...props}
      className="border border-border bg-muted/60 px-3 py-2 text-left font-semibold"
    />
  ),
  td: ({ ...props }) => (
    <td {...props} className="border border-border px-3 py-2 align-top" />
  ),
  code: ({ ...props }) => (
    <code
      {...props}
      className="bg-muted px-[0.3rem] py-[0.15rem] rounded-md text-[0.85em] font-mono text-foreground font-semibold border border-border/50"
    />
  ),
};

export function ContentRenderer({
  content,
  hideReadOnlyInteractive = false,
  plainReadOnlyInteractive = false,
}: ContentRendererProps) {
  return (
    <>
      {content.map((block) => {
        switch (block.type) {
          case 'heading':
            const level = block.metadata?.level || 2;
            const HeadingTag = `h${level}` as any;
            return (
              <HeadingTag
                key={block.id}
                id={`heading-${block.id}`}
                data-block-id={block.id}
                className="scroll-mt-24"
              >
                {block.content}
              </HeadingTag>
            );

          case 'paragraph':
            return (
              <div key={block.id} data-block-id={block.id} className="mb-6 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {block.content}
                </ReactMarkdown>
              </div>
            );

          case 'list': {
            const items = block.content
              .split(/\r?\n/)
              .map((item) => item.trim())
              .filter(Boolean);

            if (items.length === 0) {
              return null;
            }

            const isOrdered = block.metadata?.listStyle === 'ordered';
            const ListTag = isOrdered ? 'ol' : 'ul';

            return (
              <ListTag
                key={block.id}
                data-block-id={block.id}
                className={`mb-6 pl-6 ${isOrdered ? 'list-decimal' : 'list-disc'}`}
              >
                {items.map((item, index) => (
                  <li key={index} className="mb-1">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {item}
                    </ReactMarkdown>
                  </li>
                ))}
              </ListTag>
            );
          }

          case 'checklist': {
            const rows = block.content
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean);

            if (rows.length === 0) {
              return null;
            }

            return (
              <ul key={block.id} data-block-id={block.id} className="mb-6 space-y-2">
                {rows.map((row, index) => {
                  const match = row.match(/^\[(x|X|\s)\]\s*(.+)$/);
                  const checked = Boolean(match && match[1].toLowerCase() === 'x');
                  const label = match ? match[2] : row;

                  return (
                    <li key={index} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mt-1"
                      />
                      <span className={checked ? 'line-through text-muted-foreground' : ''}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={markdownComponents}
                        >
                          {label}
                        </ReactMarkdown>
                      </span>
                    </li>
                  );
                })}
              </ul>
            );
          }

          case 'table': {
            const rows = block.content
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) =>
                line
                  .split('|')
                  .map((cell) => cell.trim())
                  .filter((cell, cellIndex, array) =>
                    cellIndex === 0 || cellIndex === array.length - 1
                      ? Boolean(cell) || array.length > 2
                      : true,
                  ),
              );

            if (rows.length < 1) {
              return null;
            }

            const [header, ...body] = rows;

            return (
              <div key={block.id} data-block-id={block.id} className="mb-6 overflow-x-auto border border-border bg-card">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {header.map((cell, index) => (
                        <th key={index} className="border border-border bg-muted/60 px-3 py-2 text-left font-semibold">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {header.map((_, colIndex) => (
                          <td key={colIndex} className="border border-border px-3 py-2 align-top">
                            {row[colIndex] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'link':
            return (
              <p key={block.id} data-block-id={block.id} className="mb-6">
                <a
                  href={block.metadata?.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline decoration-primary/70 decoration-2 underline-offset-4 hover:decoration-primary font-medium"
                >
                  {block.content || block.metadata?.url || '링크'}
                </a>
              </p>
            );

          case 'code':
            return (
              <div key={block.id} data-block-id={block.id}>
                <CodeBlock
                  code={block.content}
                  language={block.metadata?.language || 'typescript'}
                />
              </div>
            );

          case 'interactive':
            if (hideReadOnlyInteractive && block.metadata?.editable === false) {
              return null;
            }
            const parsedScope = block.metadata?.scope 
              ? JSON.parse(block.metadata.scope) 
              : {};
            return (
              <div key={block.id} data-block-id={block.id}>
                <LiveCodeBlock
                  code={block.content}
                  editable={block.metadata?.editable === true ? true : block.metadata?.editable === 'restricted' ? 'restricted' : false}
                  editableLines={block.metadata?.editableLines}
                  scope={parsedScope}
                  plainReadOnly={plainReadOnlyInteractive}
                />
              </div>
            );

          case 'quote':
            return (
              <blockquote
                key={block.id}
                data-block-id={block.id}
                className="border-l-4 border-primary pl-6 py-2 my-6 italic text-lg"
              >
                {block.content}
              </blockquote>
            );

          case 'linebreak':
            return <div key={block.id} data-block-id={block.id} className="h-8 w-full" aria-hidden="true" />;

          case 'divider':
            return <div key={block.id} data-block-id={block.id}><Separator className="my-8" /></div>;

          case 'callout':
            const variant = block.metadata?.variant || 'info';
            const icons = {
              info: Info,
              warning: AlertTriangle,
              success: CheckCircle,
              error: XCircle,
            };
            const Icon = icons[variant];
            const colors = {
              info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
              warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200',
              success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200',
              error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
            };

            return (
              <Alert key={block.id} data-block-id={block.id} className={`my-6 ${colors[variant]}`}>
                <Icon className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  {block.content}
                </AlertDescription>
              </Alert>
            );

          case 'math':
            return (
              <div key={block.id} data-block-id={block.id} className="my-6 overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {`$$${block.content}$$`}
                </ReactMarkdown>
              </div>
            );

          case 'image':
            return (
              <figure key={block.id} data-block-id={block.id} className="my-8">
                <img
                  src={block.metadata?.url}
                  alt={block.metadata?.alt || block.content}
                  className="w-full rounded-lg"
                />
                {block.content && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-2">
                    {block.content}
                  </figcaption>
                )}
              </figure>
            );

          case 'iframe':
            return (
              <figure key={block.id} data-block-id={block.id} className="my-8">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <iframe
                    src={block.metadata?.url}
                    title={block.metadata?.title || block.content || 'Embedded content'}
                    className="w-full"
                    style={{ height: `${block.metadata?.height ?? 420}px` }}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                {block.content && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-2">
                    {block.content}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return null;
        }
      })}
    </>
  );
}