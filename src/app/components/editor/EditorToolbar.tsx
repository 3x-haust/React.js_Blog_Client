import { ChangeEvent, useRef, useState } from 'react';
import { FileUp, Save, Upload, ClipboardPaste } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';

interface EditorToolbarProps {
  onSave: () => void;
  onOpenDraftList: () => void;
  onPublish: () => void;
  onImportMarkdown: (file: File) => void;
  onPasteMarkdown: (markdown: string) => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  disableDraftActions?: boolean;
}

export function EditorToolbar({
  onSave,
  onOpenDraftList,
  onPublish,
  onImportMarkdown,
  onPasteMarkdown,
  isSaving = false,
  isPublishing = false,
  disableDraftActions = false,
}: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [pastedMarkdown, setPastedMarkdown] = useState('');

  const handlePickMarkdown = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onImportMarkdown(file);
    event.target.value = '';
  };

  const handlePasteSubmit = () => {
    if (!pastedMarkdown.trim()) return;
    onPasteMarkdown(pastedMarkdown);
    setPastedMarkdown('');
    setIsPasteDialogOpen(false);
  };

  return (
    <div className="sticky top-16 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDraftList}
            className="text-sm text-muted-foreground"
            disabled={disableDraftActions}
          >
            {disableDraftActions ? '수정 모드' : '에디터'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            className="hidden"
            onChange={handleImportFile}
          />

          <Button variant="ghost" size="sm" onClick={handlePickMarkdown} disabled={isPublishing}>
            <FileUp className="w-4 h-4 mr-2" />
            MD 가져오기
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setIsPasteDialogOpen(true)} disabled={isPublishing}>
            <ClipboardPaste className="w-4 h-4 mr-2" />
            MD 붙여넣기
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={isSaving || isPublishing || disableDraftActions}
          >
            <Save className="w-4 h-4 mr-2" />
            {disableDraftActions ? '임시저장 비활성' : isSaving ? '저장 중...' : '임시저장'}
          </Button>

          <Button size="sm" onClick={onPublish} disabled={isPublishing}>
            <Upload className="w-4 h-4 mr-2" />
            {isPublishing ? '처리 중...' : '발행'}
          </Button>
        </div>
      </div>

      <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>마크다운 붙여넣기</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 py-4">
            <Textarea
              placeholder="여기에 마크다운 내용을 붙여넣으세요..."
              className="w-full h-full font-mono resize-none"
              value={pastedMarkdown}
              onChange={(e) => setPastedMarkdown(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPasteDialogOpen(false)}>취소</Button>
            <Button onClick={handlePasteSubmit}>가져오기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
