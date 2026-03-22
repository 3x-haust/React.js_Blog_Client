import { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { ContentBlock } from '../../types';
import { BlockType } from '../../types';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { CodeEditor } from './CodeEditor';
import { useDrag, useDrop } from 'react-dnd';
import { blogApi } from '../../lib/api';
import { toast } from 'sonner';

interface EditorBlockProps {
  block: ContentBlock;
  index: number;
  onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
  onDelete: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onInsertBlock?: (type: BlockType, index: number) => void;
}

interface DragItem {
  index: number;
}

interface ChecklistItem {
  checked: boolean;
  text: string;
}

export function EditorBlock({ block, index, onUpdate, onDelete, onMove, onInsertBlock }: EditorBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const [editableLinesInput, setEditableLinesInput] = useState('');
  const isDividerBlock = block.type === 'divider';

  useEffect(() => {
    if (block.type !== 'interactive') {
      return;
    }

    const lines = block.metadata?.editableLines;
    const normalized = lines?.length
      ? [...lines]
          .sort((a, b) => a - b)
          .map((lineIndex) => String(lineIndex + 1))
          .join(',')
      : '';

    setEditableLinesInput(normalized);
  }, [block.id, block.type, block.metadata?.editableLines]);

  const parseEditableLines = (value: string): { lines: number[]; hasInvalid: boolean } => {
    const tokens = value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);

    const parsed = new Set<number>();
    let hasInvalid = false;

    tokens.forEach((token) => {
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);

        if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0) {
          hasInvalid = true;
          return;
        }

        const [from, to] = start <= end ? [start, end] : [end, start];
        for (let line = from; line <= to; line += 1) {
          parsed.add(line - 1);
        }
        return;
      }

      const lineNumber = Number(token);
      if (!Number.isInteger(lineNumber) || lineNumber <= 0) {
        hasInvalid = true;
        return;
      }

      parsed.add(lineNumber - 1);
    });

    return { lines: [...parsed].sort((a, b) => a - b), hasInvalid };
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EDITOR_BLOCK',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [index]);

  const [{ isOverCurrent }, drop] = useDrop(() => ({
    accept: ['EDITOR_BLOCK', 'BLOCK'],
    drop: (item: DragItem | { blockType: BlockType }, monitor) => {
      if (monitor.didDrop() || !blockRef.current) {
        return;
      }

      if (monitor.getItemType() !== 'BLOCK') {
        return;
      }

      const clientOffset = monitor.getClientOffset();
      const rect = blockRef.current.getBoundingClientRect();
      const insertAfter = clientOffset ? clientOffset.y - rect.top > rect.height / 2 : false;
      const insertIndex = insertAfter ? index + 1 : index;

      if ('blockType' in item) {
        onInsertBlock?.(item.blockType, insertIndex);
      }
    },
    hover: (item, monitor) => {
      if (monitor.getItemType() !== 'EDITOR_BLOCK') {
        return;
      }

      if (!("index" in item)) {
        return;
      }

      if (!blockRef.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = blockRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) {
        return;
      }

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  }), [index, onMove, onInsertBlock]);

  const handleContentChange = (value: string) => {
    onUpdate(block.id, { content: value });
  };

  const parseChecklistItems = (value: string): ChecklistItem[] => {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return [{ checked: false, text: '' }];
    }

    return lines.map((line) => {
      const match = line.match(/^\[(x|X|\s)\]\s*(.*)$/);
      if (!match) {
        return { checked: false, text: line };
      }

      return {
        checked: match[1].toLowerCase() === 'x',
        text: match[2],
      };
    });
  };

  const serializeChecklistItems = (items: ChecklistItem[]): string => {
    return items
      .map((item) => `[${item.checked ? 'x' : ' '}] ${item.text}`.trimEnd())
      .join('\n');
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select
                value={String(block.metadata?.level || 2)}
                onValueChange={(value) =>
                  onUpdate(block.id, { metadata: { ...block.metadata, level: Number(value) as 1 | 2 | 3 } })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1</SelectItem>
                  <SelectItem value="2">H2</SelectItem>
                  <SelectItem value="3">H3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="제목을 입력하세요..."
              className="text-2xl font-semibold border-0 focus-visible:ring-0 px-4"
            />
          </div>
        );

      case 'paragraph':
        return (
          <Textarea
            ref={textareaRef}
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="텍스트를 입력하세요..."
            className="min-h-[80px] border-0 focus-visible:ring-0 resize-none"
          />
        );

      case 'list':
        return (
          <div className="space-y-2">
            <Select
              value={block.metadata?.listStyle || 'unordered'}
              onValueChange={(value: 'unordered' | 'ordered') =>
                onUpdate(block.id, {
                  metadata: { ...block.metadata, listStyle: value },
                })
              }
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unordered">점 목록</SelectItem>
                <SelectItem value="ordered">번호 목록</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              ref={textareaRef}
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="한 줄에 한 항목씩 입력하세요..."
              className="min-h-[120px] border-0 focus-visible:ring-0 resize-y"
            />
          </div>
        );

      case 'checklist':
        const checklistItems = parseChecklistItems(block.content);

        return (
          <div className="space-y-2">
            {checklistItems.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => {
                    const nextItems = [...checklistItems];
                    nextItems[itemIndex] = {
                      ...nextItems[itemIndex],
                      checked: event.target.checked,
                    };
                    handleContentChange(serializeChecklistItems(nextItems));
                  }}
                  className="h-4 w-4"
                />
                <Input
                  value={item.text}
                  onChange={(event) => {
                    const nextItems = [...checklistItems];
                    nextItems[itemIndex] = {
                      ...nextItems[itemIndex],
                      text: event.target.value,
                    };
                    handleContentChange(serializeChecklistItems(nextItems));
                  }}
                  placeholder="할 일을 입력하세요..."
                  className={item.checked ? 'line-through text-muted-foreground' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const nextItems = checklistItems.filter((_, index) => index !== itemIndex);
                    handleContentChange(
                      serializeChecklistItems(nextItems.length ? nextItems : [{ checked: false, text: '' }]),
                    );
                  }}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleContentChange(
                  serializeChecklistItems([
                    ...checklistItems,
                    { checked: false, text: '' },
                  ]),
                );
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              항목 추가
            </Button>
          </div>
        );

      case 'table':
        return (
          <Textarea
            ref={textareaRef}
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="헤더1 | 헤더2\n값1 | 값2"
            className="min-h-[140px] border-0 focus-visible:ring-0 resize-y font-mono"
          />
        );

      case 'link':
        return (
          <div className="space-y-2">
            <Input
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="링크 텍스트"
            />
            <Input
              value={block.metadata?.url || ''}
              onChange={(e) =>
                onUpdate(block.id, {
                  metadata: {
                    ...block.metadata,
                    url: e.target.value.trim(),
                  },
                })
              }
              placeholder="https://example.com"
            />
          </div>
        );

      case 'code':
        return (
          <CodeEditor
            code={block.content}
            language={block.metadata?.language || 'typescript'}
            onChange={(code) => onUpdate(block.id, { content: code })}
            onLanguageChange={(language) =>
              onUpdate(block.id, { metadata: { ...block.metadata, language } })
            }
          />
        );

      case 'quote':
        return (
          <div className="border-l-4 border-primary pl-4">
            <Textarea
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="인용문을 입력하세요..."
              className="min-h-[60px] border-0 focus-visible:ring-0 italic resize-none"
            />
          </div>
        );

      case 'callout':
        return (
          <div className="space-y-2">
            <Select
              value={block.metadata?.variant || 'info'}
              onValueChange={(value) =>
                onUpdate(block.id, { metadata: { ...block.metadata, variant: value as any } })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="중요한 내용을 입력하세요..."
              className="min-h-[60px] border-0 focus-visible:ring-0 resize-none"
            />
          </div>
        );

      case 'math':
        return (
          <Textarea
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="LaTeX 수식 입력..."
            className="min-h-[60px] font-mono border-0 focus-visible:ring-0 resize-none"
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            <Input
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="이미지 설명 (선택사항)"
            />
            <Input
              value={block.metadata?.url || ''}
              onChange={(e) =>
                onUpdate(block.id, {
                  metadata: { ...block.metadata, url: e.target.value.trim() },
                })
              }
              placeholder="이미지 URL 입력..."
            />
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  const uploadedUrl = await blogApi.uploadImage(file);
                  onUpdate(block.id, { metadata: { ...block.metadata, url: uploadedUrl } });
                  toast.success('이미지 업로드 완료');
                } catch (error) {
                  toast.error((error as Error).message || '이미지 업로드에 실패했습니다.');
                }
              }}
            />
            {block.metadata?.url && (
              <img
                src={block.metadata.url}
                alt={block.content}
                className="max-w-full rounded-lg"
                onError={() => {
                  toast.error('이미지를 불러오지 못했습니다. 파일을 다시 업로드해주세요.');
                }}
              />
            )}
          </div>
        );

      case 'iframe':
        return (
          <div className="space-y-2">
            <Input
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="캡션 (선택사항)"
            />
            <Input
              value={block.metadata?.url || ''}
              onChange={(e) =>
                onUpdate(block.id, {
                  metadata: { ...block.metadata, url: e.target.value.trim() },
                })
              }
              placeholder="https://www.youtube.com/embed/..."
            />
            <Input
              value={String(block.metadata?.title ?? '')}
              onChange={(e) =>
                onUpdate(block.id, {
                  metadata: { ...block.metadata, title: e.target.value },
                })
              }
              placeholder="iframe title (접근성)"
            />
            <Input
              type="number"
              min={160}
              value={String(block.metadata?.height ?? 420)}
              onChange={(e) => {
                const nextHeight = Number(e.target.value);
                onUpdate(block.id, {
                  metadata: {
                    ...block.metadata,
                    height: Number.isFinite(nextHeight)
                      ? Math.max(160, Math.floor(nextHeight))
                      : 420,
                  },
                });
              }}
              placeholder="높이(px)"
            />
            {block.metadata?.url && (
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  src={block.metadata.url}
                  title={block.metadata?.title || block.content || 'Embedded content'}
                  className="w-full"
                  style={{ height: `${block.metadata?.height ?? 420}px` }}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        );

      case 'interactive':
        const editMode: 'readonly' | 'full' | 'restricted' =
          block.metadata?.editable === false
            ? 'readonly'
            : block.metadata?.editable === 'restricted'
              ? 'restricted'
              : 'full';

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <Label className="text-xs text-muted-foreground">편집 모드</Label>
              <Select
                value={editMode}
                onValueChange={(mode: 'readonly' | 'full' | 'restricted') => {
                  const nextEditable =
                    mode === 'readonly'
                      ? false
                      : mode === 'restricted'
                        ? 'restricted'
                        : true;

                  onUpdate(block.id, {
                    metadata: {
                      ...block.metadata,
                      editable: nextEditable,
                      editableLines:
                        mode === 'restricted'
                          ? block.metadata?.editableLines
                          : undefined,
                    },
                  });
                }}
              >
                <SelectTrigger className="w-44 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readonly">읽기 전용</SelectItem>
                  <SelectItem value="full">전체 편집</SelectItem>
                  <SelectItem value="restricted">특정 줄만 편집</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editMode === 'restricted' && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">편집 가능한 줄 입력</Label>
                <Input
                  value={editableLinesInput}
                  onChange={(e) => setEditableLinesInput(e.target.value)}
                  onBlur={() => {
                    const { lines, hasInvalid } = parseEditableLines(editableLinesInput);
                    onUpdate(block.id, {
                      metadata: {
                        ...block.metadata,
                        editable: 'restricted',
                        editableLines: lines.length ? lines : undefined,
                      },
                    });

                    const normalized = lines
                      .map((lineIndex) => String(lineIndex + 1))
                      .join(',');
                    setEditableLinesInput(normalized);

                    if (hasInvalid) {
                      toast.error('줄 번호 형식이 일부 올바르지 않습니다. 예: 2,4-6');
                    }
                  }}
                  placeholder="줄 번호 입력..."
                />
              </div>
            )}

            <CodeEditor
              code={block.content}
              language="jsx"
              onChange={(code) => onUpdate(block.id, { content: code })}
              onLanguageChange={() => {}}
            />
          </div>
        );

      case 'divider':
        return <div className="h-px bg-border" />;

      default:
        return null;
    }
  };

  return (
    <div
      ref={(node) => {
        blockRef.current = node;
        drop(node);
      }}
      className={`group relative py-4 pl-10 pr-12 border transition-colors rounded-md ${isOverCurrent ? 'border-primary/40 bg-muted/20' : 'border-transparent hover:border-border/60 hover:bg-muted/20'} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div
        className={`absolute left-2 opacity-70 group-hover:opacity-100 transition-opacity flex items-center ${isDividerBlock ? 'top-1/2 -translate-y-1/2' : 'top-4'}`}
      >
        <button
          ref={(node) => {
            drag(node);
          }}
          className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div
        className={`absolute right-2 opacity-70 group-hover:opacity-100 transition-opacity z-10 ${isDividerBlock ? 'top-1/2 -translate-y-1/2' : 'top-3'}`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDelete(block.id)}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {renderEditor()}
    </div>
  );
}