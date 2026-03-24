import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Calendar, Clock, Eye } from 'lucide-react';
import { Post } from '../types';
import { Card } from './ui/card';
import { formatElapsedTimeKo } from '../lib/time';

interface PostCardProps {
  post: Post;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/posts/${post.slug}`}>
        <Card className="group overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col">
          {post.thumbnail && (
            <div className="relative h-48 overflow-hidden bg-muted">
              <img
                src={post.thumbnail}
                alt={post.title}
                loading={index < 3 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                width={800}
                height={450}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          <div className="p-6 flex-1 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-3">
              {!post.isPublic && (
                <span className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded-md font-bold uppercase transition-transform group-hover:scale-105">
                  비공개
                </span>
              )}
              {post.tags
                .filter((tag) => !tag.toLowerCase().startsWith('series:'))
                .map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h2 className="text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h2>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
              {post.content.find(block => block.type === 'paragraph')?.content || ''}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatElapsedTimeKo(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{post.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
