import { useEffect, useMemo, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeContext';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const normalizedLanguage = language?.trim().toLowerCase() ?? '';

  if (normalizedLanguage === 'mermaid') {
    return <MermaidCodeBlock code={code} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              복사
            </>
          )}
        </Button>
      </div>

      <Highlight
        theme={theme === 'dark' ? themes.vsDark : themes.github}
        code={code.trim()}
        language={language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 rounded-lg overflow-x-auto text-sm border border-border`}
            style={{ ...style, margin: 0 }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-right mr-4 text-muted-foreground select-none">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function MermaidCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const diagramId = useMemo(
    () => `mermaid-${Math.random().toString(36).slice(2)}`,
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      const source = code.trim();

      if (!source) {
        setSvg('');
        setError(null);
        return;
      }

      try {
        setError(null);
        const mermaidModule = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
        );
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
        });

        const result = await mermaid.render(
          `${diagramId}-${Date.now()}`,
          source,
        );

        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg('');
          setError(
            err instanceof Error
              ? err.message
              : 'Mermaid 다이어그램을 렌더링하지 못했습니다.',
          );
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, diagramId, theme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 relative group rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          Mermaid Diagram
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              복사
            </>
          )}
        </Button>
      </div>

      {error ? (
        <div className="space-y-3 p-4">
          <p className="text-sm font-medium text-destructive">
            Mermaid 렌더링 오류: {error}
          </p>
          <Highlight
            theme={theme === 'dark' ? themes.vsDark : themes.github}
            code={code.trim()}
            language="mermaid"
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} p-4 rounded-lg overflow-x-auto text-sm border border-border`}
                style={{ ...style, margin: 0 }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    <span className="inline-block w-8 text-right mr-4 text-muted-foreground select-none">
                      {i + 1}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      ) : svg ? (
        <div
          className="overflow-x-auto bg-background p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="p-6 text-sm text-muted-foreground">
          다이어그램을 렌더링하는 중입니다...
        </div>
      )}
    </div>
  );
}

