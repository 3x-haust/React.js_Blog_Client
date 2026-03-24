import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { adminAuth, blogApi } from '../lib/api';
import { Comment } from '../types';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentSectionProps {
  postSlug: string;
}

const ADJECTIVES = [
  '소심한', '귀여운', '열정적인', '든든한', '용감한', '명랑한', '행복한', '슬픈', '화난', '신난',
  '조용한', '활발한', '영리한', '둔한', '날렵한', '묵직한', '화려한', '수수한', '냉정한', '따뜻한',
  '차가운', '단단한', '부드러운', '거친', '매끄러운', '투명한', '어두운', '밝은', '긴', '짧은'
];
const ANIMALS = [
  '여우', '사자', '고양이', '강아지', '판다', '수달', '호랑이', '곰', '늑대', '펭귄',
  '하마', '기린', '코끼리', '토끼', '다람쥐', '고래', '상어', '거북이', '악어', '카멜레온',
  '부엉이', '독수리', '비둘기', '참새', '제비', '나비', '벌', '풍뎅이', '사슴', '노루',
  '고슴도치', '두더지', '너구리', '표범', '치타', '얼룩말', '캥거루', '코알라', '낙타', '원숭이'
];

const createRandomNickname = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective}${animal}`;
};

export function CommentSection({ postSlug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState(() => localStorage.getItem('guest-nickname') || createRandomNickname());
  const [isAdmin, setIsAdmin] = useState(adminAuth.isCachedAuthenticated());
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    loadComments();

    const handleAuthChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isAuthenticated: boolean }>;
      if (typeof customEvent.detail.isAuthenticated === 'boolean') {
        setIsAdmin(customEvent.detail.isAuthenticated);
      }
    };
    window.addEventListener('auth-change', handleAuthChange);
    adminAuth.check().then(setIsAdmin);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [postSlug]);

  useEffect(() => {
    localStorage.setItem('guest-nickname', nickname);
  }, [nickname]);

  const loadComments = () => {
    blogApi.getComments(postSlug).then(setComments).catch(() => setComments([]));
  };

  const handleRandomizeNickname = () => {
    setNickname(createRandomNickname());
  };

  return (
    <div>
      <h2 className="text-2xl mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="mb-6">
        <CommentForm
          nickname={nickname}
          onChangeNickname={setNickname}
          onRandomizeNickname={handleRandomizeNickname}
          onSubmit={async (content) => {
            await blogApi.createComment(postSlug, { nickname, content });
            loadComments();
          }}
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <CommentItem
                comment={comment}
                onReply={() => setReplyTo(comment.id)}
                onEdit={isAdmin && comment.isAdminReply ? async () => {
                  const nextContent = window.prompt('댓글 내용을 수정하세요.', comment.content);
                  const trimmed = nextContent?.trim();
                  if (!trimmed) return;
                  await blogApi.updateComment(postSlug, comment.id, trimmed);
                  loadComments();
                } : undefined}
                onDelete={async () => {
                  if (!isAdmin) return;
                  const ok = window.confirm('이 댓글을 삭제할까요? 답글도 함께 삭제됩니다.');
                  if (!ok) return;
                  await blogApi.deleteComment(postSlug, comment.id);
                  loadComments();
                }}
                isAdmin={isAdmin}
              />
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-4 space-y-4 border-l-2 border-border pl-4">
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onEdit={isAdmin && reply.isAdminReply ? async () => {
                        const nextContent = window.prompt('댓글 내용을 수정하세요.', reply.content);
                        const trimmed = nextContent?.trim();
                        if (!trimmed) return;
                        await blogApi.updateComment(postSlug, reply.id, trimmed);
                        loadComments();
                      } : undefined}
                      onDelete={async () => {
                        if (!isAdmin) return;
                        const ok = window.confirm('이 댓글을 삭제할까요?');
                        if (!ok) return;
                        await blogApi.deleteComment(postSlug, reply.id);
                        loadComments();
                      }}
                      isReply
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}

              {replyTo === comment.id && (
                <div className="ml-8 mt-4">
                  <CommentForm
                    nickname="admin"
                    parentId={comment.id}
                    submitLabel="관리자 답글 작성"
                    onSubmit={async (content) => {
                      await blogApi.createAdminReply(
                        postSlug,
                        comment.id,
                        content,
                      );
                      loadComments();
                      setReplyTo(null);
                    }}
                    onCancelReply={() => setReplyTo(null)}
                    autoFocus
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <p className="text-center py-12 text-muted-foreground">
            아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
          </p>
        )}
      </div>
    </div>
  );
}
