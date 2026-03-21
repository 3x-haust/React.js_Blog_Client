import { Link } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Post } from '../types';
import { Card } from './ui/card';

interface SeriesNavigatorProps {
  series: string;
  currentPost: Post;
  posts: Post[];
}

export function SeriesNavigator({ series, currentPost, posts }: SeriesNavigatorProps) {
  if (posts.length <= 1) {
    return null;
  }

  const currentIndex = posts.findIndex((post) => post.slug === currentPost.slug);
  if (currentIndex === -1) {
    return null;
  }

  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <Card className="p-5 mb-10 border-primary/20">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg">시리즈: {series}</h2>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {prevPost ? (
          <Link
            to={`/posts/${prevPost.slug}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
            className="p-3 rounded-md border border-border hover:border-primary/40 transition-colors"
          >
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              이전 글
            </div>
            <p className="line-clamp-2">{prevPost.title}</p>
          </Link>
        ) : (
          <div className="p-3 rounded-md border border-border/40 text-muted-foreground text-sm">첫 글입니다</div>
        )}

        {nextPost ? (
          <Link
            to={`/posts/${nextPost.slug}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
            className="p-3 rounded-md border border-border hover:border-primary/40 transition-colors"
          >
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
              다음 글
              <ArrowRight className="w-3 h-3" />
            </div>
            <p className="line-clamp-2 text-right">{nextPost.title}</p>
          </Link>
        ) : (
          <div className="p-3 rounded-md border border-border/40 text-muted-foreground text-sm text-right">마지막 글입니다</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            to={`/posts/${post.slug}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              post.slug === currentPost.slug
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {index + 1}
          </Link>
        ))}
      </div>
    </Card>
  );
}
