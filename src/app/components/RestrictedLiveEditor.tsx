import { useEffect, useMemo, useRef, useState } from 'react';

interface RestrictedLiveEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: string;
  theme: any; // Prism theme
}

/**
 * 특정 텍스트를 [[수정가능]] 형태로 감싸면 해당 부분만 인라인 에디터로 변환합니다.
 * 예: const name = "[[John]]";
 */
export function RestrictedLiveEditor({
  code: initialCode,
  onChange,
}: RestrictedLiveEditorProps) {
  const [code, setCode] = useState(initialCode);
  
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  // [[value]] 패턴을 찾아내는 정규식
  const INLINE_EDIT_REGEX = /\[\[(.*?)\]\]/g;

  const handleInlineChange = (lineIndex: number, partIndex: number, newValue: string) => {
    const lines = code.split('\n');
    const line = lines[lineIndex];
    
    // 해당 라인의 모든 [[...]]를 찾아서 n번째 것만 교체
    let currentPart = 0;
    const newLine = line.replace(INLINE_EDIT_REGEX, (match, p1) => {
      if (currentPart === partIndex) {
        currentPart++;
        return `[[${newValue}]]`;
      }
      currentPart++;
      return match;
    });

    const newCode = [...lines];
    newCode[lineIndex] = newLine;
    const finalCode = newCode.join('\n');
    
    setCode(finalCode);
    onChange(finalCode);
  };

  const lines = useMemo(() => code.split('\n'), [code]);

  return (
    <div className="font-mono text-sm leading-relaxed overflow-x-auto bg-muted/20 text-foreground dark:bg-zinc-900 p-6 rounded-lg border border-border">
      {lines.map((line, lineIndex) => {
        // 해당 라인에 [[...]]가 있는지 확인
        const parts = line.split(INLINE_EDIT_REGEX);
        const matches = [...line.matchAll(INLINE_EDIT_REGEX)];
        
        if (matches.length === 0) {
          return (
            <div key={lineIndex} className="flex min-h-[28px] items-center">
              <span className="w-8 text-right mr-4 opacity-30 select-none text-xs">{lineIndex + 1}</span>
              <span className="whitespace-pre opacity-70">{line || ' '}</span>
            </div>
          );
        }

        return (
          <div key={lineIndex} className="flex min-h-[28px] items-center">
            <span className="w-8 text-right mr-4 opacity-30 select-none text-xs">{lineIndex + 1}</span>
            <div className="flex flex-wrap items-center whitespace-pre">
              {parts.map((part, partIndex) => {
                // 짝수 인덱스는 일반 텍스트, 홀수 인덱스는 [[...]] 내부 값
                const isEditablePart = partIndex % 2 !== 0;
                
                if (isEditablePart) {
                  const matchIndex = Math.floor(partIndex / 2);
                  return (
                    <span key={partIndex} className="inline-block px-1 group relative">
                      <input
                        type="text"
                        value={part}
                        onChange={(e) => handleInlineChange(lineIndex, matchIndex, e.target.value)}
                        className="bg-primary/10 border-b-2 border-primary outline-none px-1 py-0 min-w-[20px] text-primary font-bold focus:bg-primary/20 transition-colors"
                        style={{ width: `${Math.max(part.length + 1, 2)}ch` }}
                      />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        수정 가능
                      </span>
                    </span>
                  );
                }
                
                return <span key={partIndex} className="opacity-70">{part}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
