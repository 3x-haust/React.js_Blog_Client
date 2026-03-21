import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { blogApi, visitor } from '../lib/api';

interface ReactionBarProps {
  slug: string;
  heartCount: number;
  onReact: () => void;
}

export function ReactionBar({ slug, heartCount, onReact }: ReactionBarProps) {
  const [liked, setLiked] = useState(false);
  const [displayHeartCount, setDisplayHeartCount] = useState(heartCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justReacted, setJustReacted] = useState(false);

  useEffect(() => {
    setDisplayHeartCount(heartCount);
  }, [heartCount]);

  useEffect(() => {
    const clientId = visitor.getId();
    blogApi
      .getHeartStatus(slug, clientId)
      .then((result) => {
        setLiked(result.liked);
        setDisplayHeartCount(result.heartCount);
      })
      .catch(() => {
        setLiked(false);
        setDisplayHeartCount(heartCount);
      });
  }, [slug]);

  const handleHeart = async () => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const clientId = visitor.getId();
      const result = await blogApi.heartPost(slug, clientId);
      setLiked(result.liked);
      setDisplayHeartCount(result.heartCount);

      if (result.liked) {
        setJustReacted(true);
        setTimeout(() => setJustReacted(false), 1000);
      }

      onReact();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-y border-border py-6 my-8">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
        이 포스트가 도움이 되었나요?
      </h3>
      <motion.button
        onClick={handleHeart}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 disabled:opacity-70 rounded-full transition-colors"
        whileHover={isSubmitting ? undefined : { scale: 1.05 }}
        whileTap={isSubmitting ? undefined : { scale: 0.95 }}
        animate={justReacted ? { scale: [1, 1.2, 1], transition: { duration: 0.4 } } : {}}
      >
        <Heart className={`w-5 h-5 ${liked ? 'fill-current text-red-500' : ''}`} />
        <span className="text-sm font-medium">{displayHeartCount}</span>
      </motion.button>
    </div>
  );
}
