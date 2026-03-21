import { useEffect, useRef } from 'react';
import { BlockType } from '../../types';
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
} from 'lucide-react';
import { Card } from '../ui/card';

interface SlashCommandProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const COMMANDS = [
  { type: 'heading' as BlockType, icon: Heading2, label: '제목', description: '섹션 제목' },
  { type: 'paragraph' as BlockType, icon: Type, label: '텍스트', description: '일반 텍스트' },
  { type: 'list' as BlockType, icon: List, label: '리스트', description: '순서/비순서 목록' },
  { type: 'checklist' as BlockType, icon: CheckSquare, label: '체크리스트', description: '체크박스 목록' },
  { type: 'table' as BlockType, icon: Table, label: '테이블', description: '표 형식 데이터' },
  { type: 'link' as BlockType, icon: Link2, label: '링크', description: 'URL 링크' },
  { type: 'code' as BlockType, icon: Code, label: '코드', description: '코드 블록' },
  { type: 'interactive' as BlockType, icon: Play, label: '인터랙티브', description: '실행 가능한 코드' },
  { type: 'quote' as BlockType, icon: Quote, label: '인용', description: '인용문' },
  { type: 'callout' as BlockType, icon: Info, label: '콜아웃', description: '강조 상자' },
  { type: 'image' as BlockType, icon: Image, label: '이미지', description: '이미지 삽입' },
  { type: 'math' as BlockType, icon: Sigma, label: '수식', description: 'LaTeX 수식' },
  { type: 'divider' as BlockType, icon: Minus, label: '구분선', description: '수평선' },
];

export function SlashCommand({ onSelect, onClose }: SlashCommandProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <Card ref={ref} className="relative z-20 mt-2 p-2 w-full border border-border bg-card">
      <div className="space-y-1">
        {COMMANDS.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="w-full flex items-center gap-3 p-2 hover:bg-muted transition-colors text-left"
          >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}