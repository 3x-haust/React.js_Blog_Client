import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'python', 'java', 'rust',
  'go', 'cpp', 'css', 'html', 'json', 'yaml', 'bash', 'sql',
];

export function CodeEditor({ code, language, onChange, onLanguageChange }: CodeEditorProps) {
  return (
    <div className="border border-border dark:border-zinc-800 rounded-lg overflow-hidden dark:bg-black">
      <div className="bg-muted dark:bg-zinc-950 px-3 py-2 border-b border-border dark:border-zinc-800 flex items-center justify-between">
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(lang => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="코드를 입력하세요..."
        className="h-[300px] font-mono text-sm border-0 rounded-none resize-none dark:bg-black dark:text-zinc-100"
        style={{ fontFamily: 'Monaco, Consolas, monospace' }}
      />
    </div>
  );
}
