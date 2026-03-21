import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Reply } from 'lucide-react';
import { Comment } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface CommentItemProps {
  comment: Comment;
  isAdmin: boolean;
  onReply?: () => void;
  isReply?: boolean;
}

export function CommentItem({ comment, isAdmin, onReply, isReply }: CommentItemProps) {
  const [isAvatarError, setIsAvatarError] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {isAvatarError ? (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs">
            {comment.nickname.slice(0, 2)}
          </div>
        ) : (
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.avatarSeed || comment.nickname}`}
            alt="avatar"
            className="w-10 h-10 rounded-full"
            onError={() => setIsAvatarError(true)}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{comment.nickname}</span>
              {comment.isAdminReply && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">관리자</span>
              )}
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
              {comment.edited && (
                <span className="text-xs px-2 py-0.5 bg-muted rounded">수정됨</span>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
            {comment.content}
          </p>

          {isAdmin && onReply && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              className="h-7 px-2 text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              관리자 답글
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
