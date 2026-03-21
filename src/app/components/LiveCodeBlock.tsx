import { useEffect, useState } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { themes } from 'prism-react-renderer';
import { motion } from 'motion/react';
import { RotateCcw, Code2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { RestrictedLiveEditor } from './RestrictedLiveEditor';
import { FullLiveEditor } from './FullLiveEditor';
import * as RadixUI from '@radix-ui/react-checkbox';
import * as RadixSwitch from '@radix-ui/react-switch';
import * as RadixSlider from '@radix-ui/react-slider';
import * as RadixRadio from '@radix-ui/react-radio-group';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button as UIButton } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LiveCodeBlockProps {
  code: string;
  editable?: boolean | 'restricted';
  editableLines?: number[];
  scope?: Record<string, any>;
  plainReadOnly?: boolean;
}

const defaultScope = {
  useState,
  motion,
  Checkbox,
  Switch,
  Slider,
  RadioGroup,
  RadioGroupItem,
  Label,
  Input,
  Button: UIButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
};

export function LiveCodeBlock({
  code: initialCode,
  editable = false,
  editableLines,
  scope = {},
  plainReadOnly = false,
}: LiveCodeBlockProps) {
  const { theme } = useTheme();
  const [code, setCode] = useState(initialCode);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleReset = () => {
    setCode(initialCode);
    setKey(prev => prev + 1);
  };

  const combinedScope = { ...defaultScope, ...scope };

  const restrictedLineIndexes =
    editable === 'restricted'
      ? editableLines?.length
        ? editableLines.filter((lineIndex) =>
            Number.isInteger(lineIndex) && lineIndex >= 0,
          )
        : initialCode
            .split('\n')
            .map((line, index) => (line.includes('// ✏️') ? index : -1))
            .filter((index) => index !== -1)
      : [];

  const isFullyEditable = editable === true;
  const isReadOnly = editable === false;

  if (isReadOnly) {
    if (plainReadOnly) {
      return (
        <LiveProvider
          key={key}
          code={code}
          scope={combinedScope}
          theme={theme === 'dark' ? themes.vsDark : themes.github}
          language="jsx"
        >
          <div className="my-6 p-0 bg-transparent min-h-[220px]">
            <LivePreview />
          </div>
        </LiveProvider>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-6 rounded-xl border border-border overflow-hidden bg-card shadow-lg"
      >
        <LiveProvider
          key={key}
          code={code}
          scope={combinedScope}
          theme={theme === 'dark' ? themes.vsDark : themes.github}
          language="jsx"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <span className="text-sm font-medium">미리보기</span>
          </div>

          <div className="p-6 bg-background min-h-[300px]">
            <LivePreview />
          </div>
        </LiveProvider>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 rounded-xl border border-border overflow-hidden bg-card shadow-lg"
    >
      <LiveProvider
        key={key}
        code={code}
        scope={combinedScope}
        theme={theme === 'dark' ? themes.vsDark : themes.github}
        language="jsx"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">라이브 에디터</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기화
          </Button>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-border">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                코드
              </span>
            </div>
            {isFullyEditable ? (
              <FullLiveEditor
                code={code}
                onChange={setCode}
                language="jsx"
                theme={theme === 'dark' ? themes.vsDark : themes.github}
              />
            ) : (
              <RestrictedLiveEditor
                code={code}
                onChange={setCode}
                editableLines={restrictedLineIndexes}
                language="jsx"
                theme={theme === 'dark' ? themes.vsDark : themes.github}
              />
            )}
            <LiveError className="m-4 p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-mono" />
          </div>

          <div>
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                미리보기
              </span>
            </div>
            <div className="p-6 bg-background min-h-[200px]">
              <LivePreview />
            </div>
          </div>
        </div>
      </LiveProvider>
    </motion.div>
  );
}