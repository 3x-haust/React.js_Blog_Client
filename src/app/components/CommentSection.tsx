import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { adminAuth, blogApi } from '../lib/api';
import { Comment } from '../types';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Button } from './ui/button';

interface CommentSectionProps {
  postSlug: string;
}

const ADJECTIVES = ['소심한', '귀여운', '열정적인', '든든한', '용감한', '명랑한'];
const ANIMALS = ['여우', '사자', '고양이', '강아지', '판다', '수달'];

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
                isAdmin={isAdmin}
              />
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-4 space-y-4 border-l-2 border-border pl-4">
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
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
