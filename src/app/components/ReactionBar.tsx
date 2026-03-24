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
  const [copied, setCopied] = useState(false);

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
    if (isSubmitting) return;

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
    <div className="flex flex-col items-center gap-1 p-2 bg-muted/30 backdrop-blur-sm border border-border rounded-full w-fit">
      <motion.button
        onClick={handleHeart}
        disabled={isSubmitting}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          liked 
            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
            : 'hover:bg-muted text-muted-foreground border border-transparent'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={justReacted ? { scale: [1, 1.4, 1] } : {}}
      >
        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
      </motion.button>
      <span className="text-xs font-medium text-muted-foreground mb-1">
        {displayHeartCount}
      </span>
    </div>
  );
}
