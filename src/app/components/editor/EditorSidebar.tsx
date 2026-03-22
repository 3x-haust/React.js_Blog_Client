import { useDrag } from 'react-dnd';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import {
  Heading2,
  Type,
  List,
  CheckSquare,
  Table,
  Link2,
  Code,
  Image,
  Minus,
  Quote,
  Info,
  Sigma,
  Play,
  Frame,
} from 'lucide-react';
import { BlockType } from '../../types';
import { Card } from '../ui/card';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';

const BLOCK_TYPES = [
  { type: 'heading' as BlockType, icon: Heading2, label: 'Heading', color: 'text-foreground' },
  { type: 'paragraph' as BlockType, icon: Type, label: 'Paragraph', color: 'text-foreground/80' },
  { type: 'list' as BlockType, icon: List, label: 'List', color: 'text-foreground' },
  { type: 'checklist' as BlockType, icon: CheckSquare, label: 'Checklist', color: 'text-foreground' },
  { type: 'table' as BlockType, icon: Table, label: 'Table', color: 'text-foreground' },
  { type: 'link' as BlockType, icon: Link2, label: 'Link', color: 'text-foreground' },
  { type: 'code' as BlockType, icon: Code, label: 'Code Block', color: 'text-foreground' },
  { type: 'interactive' as BlockType, icon: Play, label: 'Interactive', color: 'text-foreground' },
  { type: 'iframe' as BlockType, icon: Frame, label: 'iFrame', color: 'text-foreground' },
  { type: 'image' as BlockType, icon: Image, label: 'Image', color: 'text-foreground/80' },
  { type: 'divider' as BlockType, icon: Minus, label: 'Divider', color: 'text-muted-foreground' },
  { type: 'quote' as BlockType, icon: Quote, label: 'Quote', color: 'text-foreground' },
  { type: 'callout' as BlockType, icon: Info, label: 'Callout', color: 'text-foreground' },
  { type: 'math' as BlockType, icon: Sigma, label: 'Math', color: 'text-foreground' },
];

function DraggableBlock({ type, icon: Icon, label, color }: typeof BLOCK_TYPES[0]) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'BLOCK',
    item: { blockType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 rounded-lg border border-border bg-card hover:bg-muted cursor-move transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export function EditorSidebar() {
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground">콘텐츠 블록</h3>
      <div className="space-y-2">
        {BLOCK_TYPES.map((blockType) => (
          <DraggableBlock key={blockType.type} {...blockType} />
        ))}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:block w-64 border-r border-border p-4 sticky top-28 h-[calc(100vh-7rem)] overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="md:hidden fixed bottom-20 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}