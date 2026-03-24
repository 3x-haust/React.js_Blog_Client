import { ChangeEvent, useRef } from 'react';
import { FileUp, Save, Upload, FileDown } from 'lucide-react';
import { Button } from '../ui/button';

interface EditorToolbarProps {
  onSave: () => void;
  onOpenDraftList: () => void;
  onPublish: () => void;
  onImportMarkdown: (file: File) => void;
  onExportMarkdown: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  disableDraftActions?: boolean;
}

export function EditorToolbar({
  onSave,
  onOpenDraftList,
  onPublish,
  onImportMarkdown,
  onExportMarkdown,
  isSaving = false,
  isPublishing = false,
  disableDraftActions = false,
}: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <div className="sticky top-0 z-40 bg-card border-b border-border">
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

          <Button variant="ghost" size="sm" onClick={onExportMarkdown} disabled={isPublishing}>
            <FileDown className="w-4 h-4 mr-2" />
            MD 내보내기
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
    </div>
  );
}
