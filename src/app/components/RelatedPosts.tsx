import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Post } from '../types';
import { blogApi } from '../lib/api';
import { Card } from './ui/card';
import { ArrowRight } from 'lucide-react';

interface RelatedPostsProps {
  currentPost: Post;
}

export function RelatedPosts({ currentPost }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  useEffect(() => {
    blogApi.getRelatedPosts(currentPost.slug, 3).then(setRelatedPosts).catch(() => setRelatedPosts([]));
  }, [currentPost.slug]);

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <h2 className="text-2xl mb-6">관련 포스트</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedPosts.map(post => (
          <Link
            key={post.id}
            to={`/posts/${post.slug}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
          >
            <Card className="p-4 h-full hover:shadow-md transition-shadow group">
              {post.thumbnail && (
                <div className="mb-3 rounded-lg overflow-hidden h-32 bg-muted">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex gap-1.5 mb-2">
                {post.tags
                  .filter((tag) => !tag.toLowerCase().startsWith('series:'))
                  .slice(0, 2)
                  .map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                <span>더 읽기</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
