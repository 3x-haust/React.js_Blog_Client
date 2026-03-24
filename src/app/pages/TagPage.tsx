import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Tag as TagIcon } from 'lucide-react';
import { blogApi } from '../lib/api';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { Button } from '../components/ui/button';

export function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  const currentTag = decodeURIComponent(tag || '').trim();
  const normalizedTag = currentTag.toLowerCase();
  const isTagDetail = Boolean(currentTag);

  useEffect(() => {
    blogApi.getTags().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    if (!isTagDetail) {
      setPosts([]);
      return;
    }

    blogApi.getPosts().then(setPosts).catch(() => setPosts([]));
  }, [isTagDetail]);

  useEffect(() => {
    if (isTagDetail) {
      document.title = `#${currentTag} - 3xhaust blog`;
    } else {
      document.title = 'Tags - 3xhaust blog';
    }
  }, [isTagDetail, currentTag]);
  
  const filteredPosts = posts
    .filter(post => post.tags.some(postTag => postTag.toLowerCase() === normalizedTag))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!isTagDetail) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <TagIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl">태그</h1>
          </div>

          <p className="text-muted-foreground">
            {tags.length}개의 태그
          </p>
        </motion.div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.map((item) => (
              <Link
                key={item.tag}
                to={`/tags/${encodeURIComponent(item.tag)}`}
                className="px-3 py-2 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                #{item.tag} ({item.count})
              </Link>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <p className="text-xl">등록된 태그가 없습니다</p>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link to="/">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <TagIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl">#{currentTag}</h1>
        </div>
        
        <p className="text-muted-foreground">
          {filteredPosts.length}개의 포스트
        </p>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((item) => (
              <Link
                key={item.tag}
                to={`/tags/${encodeURIComponent(item.tag)}`}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  item.tag.toLowerCase() === normalizedTag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                #{item.tag} ({item.count})
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 text-muted-foreground"
        >
          <p className="text-xl">이 태그의 포스트가 없습니다</p>
        </motion.div>
      )}
    </div>
  );
}
