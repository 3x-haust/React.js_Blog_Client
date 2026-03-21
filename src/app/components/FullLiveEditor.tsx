import { useMemo, useRef, type UIEventHandler } from 'react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';

interface FullLiveEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: string;
  theme: PrismTheme;
}

export function FullLiveEditor({
  code,
  onChange,
  language = 'jsx',
  theme,
}: FullLiveEditorProps) {
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const lineHeightPx = 24;
  const verticalPaddingPx = 48;
  const monospaceFontFamily =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);
  const editorHeight = useMemo(() => {
    return Math.max(220, lineCount * lineHeightPx + verticalPaddingPx);
  }, [lineCount, lineHeightPx, verticalPaddingPx]);

  const handleScroll: UIEventHandler<HTMLTextAreaElement> = (event) => {
    const target = event.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }

    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  return (
    <div
      className="relative bg-muted/20 text-foreground dark:bg-zinc-900"
      style={{ height: `${editorHeight}px` }}
    >
      <div className="absolute inset-0 flex pointer-events-none">
        <div
          ref={gutterRef}
          className="w-14 shrink-0 overflow-hidden border-r border-border/70 px-2 py-6 text-right text-sm leading-6 text-muted-foreground/70"
          style={{ fontFamily: monospaceFontFamily }}
        >
          {Array.from({ length: lineCount }).map((_, index) => (
            <div key={index} className="h-6 select-none">
              {index + 1}
            </div>
          ))}
        </div>

        <div
          ref={highlightRef}
          className="flex-1 overflow-hidden px-4 py-6 text-sm leading-6"
          style={{ fontFamily: monospaceFontFamily }}
        >
          <Highlight code={code || ' '} language={language} theme={theme}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={className}
                style={{
                  ...style,
                  margin: 0,
                  background: 'transparent',
                  fontFamily: monospaceFontFamily,
                  lineHeight: `${lineHeightPx}px`,
                }}
              >
                {tokens.map((line, index) => (
                  <div
                    key={index}
                    {...getLineProps({ line })}
                    style={{ minHeight: `${lineHeightPx}px` }}
                  >
                    {line.map((token, tokenIndex) => (
                      <span key={tokenIndex} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(event) => onChange(event.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="relative z-10 w-full resize-none overflow-x-auto overflow-y-hidden bg-transparent py-6 pl-[4.5rem] pr-4 text-sm leading-6 text-transparent caret-foreground outline-none selection:bg-primary/20"
        style={{
          height: `${editorHeight}px`,
          whiteSpace: 'pre',
          overflowWrap: 'normal',
          tabSize: 2,
          fontFamily: monospaceFontFamily,
          lineHeight: `${lineHeightPx}px`,
        }}
      />
    </div>
  );
}
