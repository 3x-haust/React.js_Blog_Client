import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';

interface CommentFormProps {
  nickname: string;
  onChangeNickname?: (value: string) => void;
  onRandomizeNickname?: () => void;
  submitLabel?: string;
  parentId?: string | null;
  onSubmit: (content: string) => Promise<void> | void;
  onCancelReply?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  nickname,
  onChangeNickname,
  onRandomizeNickname,
  submitLabel,
  parentId,
  onSubmit,
  onCancelReply,
  autoFocus,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {!parentId && (
          <div className="flex items-center gap-2">
            <input
              value={nickname}
              onChange={(e) => onChangeNickname?.(e.target.value)}
              className="h-9 px-3 border border-border bg-background text-sm flex-1"
              placeholder="닉네임"
            />
            <Button type="button" variant="secondary" size="sm" onClick={onRandomizeNickname}>
              랜덤
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId ? "답글 작성..." : "댓글 작성..."}
            className="min-h-[100px]"
            autoFocus={autoFocus}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting
                ? '작성 중...'
                : submitLabel ?? (parentId ? '답글 작성' : '댓글 작성')}
            </Button>

            {parentId && onCancelReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
              >
                취소
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
