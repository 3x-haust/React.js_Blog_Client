import { useState } from 'react';
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
