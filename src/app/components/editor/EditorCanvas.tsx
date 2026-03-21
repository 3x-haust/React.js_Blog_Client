import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import { useDrop } from 'react-dnd';
import { ContentBlock, BlockType } from '../../types';
import { EditorBlock } from './EditorBlock';
import { Plus } from 'lucide-react';

interface EditorCanvasProps {
  content: ContentBlock[];
  onChange: Dispatch<SetStateAction<ContentBlock[]>>;
}

export function EditorCanvas({ content, onChange }: EditorCanvasProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const quickAddBlockTypes: Array<{ type: BlockType; label: string }> = [
    { type: 'paragraph', label: '텍스트' },
    { type: 'heading', label: '제목' },
    { type: 'list', label: '리스트' },
    { type: 'checklist', label: '체크리스트' },
    { type: 'table', label: '표' },
    { type: 'link', label: '링크' },
    { type: 'code', label: '코드' },
    { type: 'interactive', label: '인터랙티브' },
    { type: 'image', label: '이미지' },
    { type: 'quote', label: '인용' },
    { type: 'callout', label: '콜아웃' },
    { type: 'math', label: '수식' },
    { type: 'divider', label: '구분선' },
  ];

  const createBlockId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const handleAddBlock = (type: BlockType, index: number) => {
    let defaultContent = '';
    let defaultMetadata: ContentBlock['metadata'] = {};

    switch (type) {
      case 'heading':
        defaultMetadata = { level: 2 };
        break;
      case 'list':
        defaultMetadata = { listStyle: 'unordered' };
        defaultContent = '항목 1\n항목 2\n항목 3';
        break;
      case 'checklist':
        defaultContent = '[ ] 할 일 1\n[x] 할 일 2';
        break;
      case 'table':
        defaultContent = '항목 | 값\n예시 A | 1\n예시 B | 2';
        break;
      case 'link':
        defaultContent = '링크 텍스트';
        defaultMetadata = { url: 'https://example.com' };
        break;
      case 'code':
        defaultMetadata = { language: 'typescript' };
        break;
      case 'interactive':
        defaultMetadata = { editable: true };
        defaultContent = `function Example() {
  const [count, setCount] = useState(0);
  
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>인터랙티브 예제</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold text-center">
          {count}
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setCount(count - 1)}>
            -
          </Button>
          <Button onClick={() => setCount(count + 1)}>
            +
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}`;
        break;
      case 'callout':
        defaultMetadata = { variant: 'info' };
        break;
    }

    const newBlock: ContentBlock = {
      id: createBlockId(),
      type,
      content: defaultContent,
      metadata: defaultMetadata,
    };

    onChange((prevContent) => {
      const insertIndex = Math.max(0, Math.min(index, prevContent.length));
      const newContent = [...prevContent];
      newContent.splice(insertIndex, 0, newBlock);
      return newContent;
    });
  };

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ['BLOCK'],
      drop: (item: { blockType: BlockType }, monitor) => {
        if (monitor.didDrop()) return;
        handleAddBlock(item.blockType, content.length);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [content.length]
  );

  const handleUpdateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChange((prevContent) =>
      prevContent.map((block) =>
        block.id === id ? { ...block, ...updates } : block,
      ),
    );
  };

  const handleDeleteBlock = (id: string) => {
    onChange((prevContent) => prevContent.filter((block) => block.id !== id));
  };

  const handleMoveBlock = (fromIndex: number, toIndex: number) => {
    onChange((prevContent) => {
      const newContent = [...prevContent];
      const [moved] = newContent.splice(fromIndex, 1);

      if (!moved) {
        return prevContent;
      }

      newContent.splice(toIndex, 0, moved);
      return newContent;
    });
  };

  const handleCanvasClick = (_e: MouseEvent<HTMLDivElement>) => {};

  return (
    <div
      ref={drop}
      onClick={handleCanvasClick}
      className={`group relative min-h-[500px] px-3 py-4 pb-14 ${isOver ? 'bg-muted/40' : ''}`}
    >
      {content.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-md">
          <p className="text-sm">왼쪽 블록을 드래그해서 시작하세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {content.map((block, index) => (
            <div key={block.id}>
              <EditorBlock
                block={block}
                index={index}
                onUpdate={handleUpdateBlock}
                onDelete={handleDeleteBlock}
                onMove={handleMoveBlock}
                onInsertBlock={handleAddBlock}
              />
            </div>
          ))}
        </div>
      )}

      {content.length > 0 && (
        <div className="absolute bottom-2 right-2">
          {isQuickAddOpen && (
            <div className="mb-2 w-40 max-h-72 overflow-y-auto border border-border bg-card shadow-lg p-1">
              {quickAddBlockTypes.map((block) => (
                <button
                  key={block.type}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBlock(block.type, content.length);
                    setIsQuickAddOpen(false);
                  }}
                  className="w-full text-left text-sm px-2 py-1.5 hover:bg-muted"
                >
                  {block.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickAddOpen((prev) => !prev);
            }}
            className="h-8 w-8 border border-border bg-card text-muted-foreground hover:text-foreground transition-opacity opacity-0 group-hover:opacity-100 flex items-center justify-center"
            aria-label="블록 추가"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}