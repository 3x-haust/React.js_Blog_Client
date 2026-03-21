import { useEffect, useMemo, useRef, useState } from 'react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';

interface RestrictedLiveEditorProps {
  code: string;
  onChange: (code: string) => void;
  editableLines: number[];
  language?: string;
  theme: PrismTheme;
}

export function RestrictedLiveEditor({
  code,
  onChange,
  editableLines,
  language = 'jsx',
  theme,
}: RestrictedLiveEditorProps) {
  const [lines, setLines] = useState(code.split('\n'));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setLines(code.split('\n'));
  }, [code]);

  const normalizedCodeForHighlight = useMemo(
    () => lines.map((line) => line.replace(/\s*\/\/\s*✏️\s*$/, '')).join('\n'),
    [lines],
  );

  const handleLineChange = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index] = value;
    setLines(newLines);
    onChange(newLines.join('\n'));
  };

  return (
    <div
      className="font-mono text-sm leading-relaxed overflow-x-auto bg-muted/20 text-foreground dark:bg-zinc-900"
      style={{
        padding: '1.5rem',
      }}
    >
      <Highlight
        code={normalizedCodeForHighlight || ' '}
        language={language}
        theme={theme}
      >
        {({ tokens, getLineProps, getTokenProps }) => (
          <>
            {lines.map((line, index) => {
              const isEditable = editableLines.includes(index);
              const displayLine = line.replace(/\s*\/\/\s*✏️\s*$/, '');
              const highlightedTokens = tokens[index] ?? [];

              return (
                <div key={index} className="flex items-center min-h-[24px]">
                  <span className="inline-block w-10 text-right mr-4 select-none opacity-40">
                    {index + 1}
                  </span>
                  {isEditable ? (
                    <div className="flex-1 flex items-center">
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        value={displayLine}
                        onChange={(e) => handleLineChange(index, e.target.value)}
                        className="flex-1 bg-card border border-border outline-none font-mono text-sm px-2 py-0.5 rounded transition-colors text-foreground"
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <span
                      {...getLineProps({ line: highlightedTokens })}
                      className="flex-1 select-none whitespace-pre"
                    >
                      {highlightedTokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} {...getTokenProps({ token })} />
                      ))}
                      {line.includes('🔒') && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                          🔒
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </Highlight>
    </div>
  );
}