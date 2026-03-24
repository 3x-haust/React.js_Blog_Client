import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, Eye, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { adminAuth, blogApi } from '../lib/api';
import { Post } from '../types';
import { Button } from '../components/ui/button';
import { ContentRenderer } from '../components/ContentRenderer';
import { TableOfContents } from '../components/TableOfContents';
import { ReadingProgress } from '../components/ReadingProgress';
import { ReactionBar } from '../components/ReactionBar';
import { CommentSection } from '../components/CommentSection';
import { RelatedPosts } from '../components/RelatedPosts';
import { SeriesNavigator } from '../components/SeriesNavigator';
import { NotFound } from './NotFound';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { formatElapsedTimeKo } from '../lib/time';

export function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [seriesInfo, setSeriesInfo] = useState<{ series: string | null; posts: Post[] } | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => adminAuth.isCachedAuthenticated());
  const [isDeleting, setIsDeleting] = useState(false);

  useSwipeBack();

  useEffect(() => {
    adminAuth.check().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!slug) {
      setPost(null);
      setIsLoadingPost(false);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
    setIsLoadingPost(true);
    setSeriesInfo(null);

    const load = async () => {
      const foundPost = await blogApi.getPost(slug);
      setPost(foundPost);

      const [seriesResult] = await Promise.allSettled([
        blogApi.getSeriesPosts(slug),
        blogApi.incrementView(slug),
      ]);

      if (seriesResult.status === 'fulfilled') {
        setSeriesInfo(seriesResult.value);
      }

      try {
        const updatedPost = await blogApi.getPost(slug);
        setPost(updatedPost);
      } catch {
        return;
      }
    };

    load()
      .catch(() => setPost(null))
      .finally(() => setIsLoadingPost(false));

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} - 3xhaust blog`;
    }
  }, [post?.title]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!post || isDeleting) return;
    const ok = window.confirm('이 포스트를 삭제할까요? 삭제 후 복구할 수 없습니다.');
    if (!ok) return;

    try {
      setIsDeleting(true);
      await blogApi.deletePost(post.slug);
      navigate('/');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingPost) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        글을 불러오는 중...
      </div>
    );
  }

  if (!post) {
    return <NotFound />;
  }

  return (
    <div className="relative">
      <ReadingProgress />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
          <article className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link to="/">
                <Button variant="ghost" className="mb-6 -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  뒤로 가기
                </Button>
              </Link>

              {isAdmin && (
                <div className="mb-6 flex items-center gap-2">
                  <Link to={`/editor/${post.slug}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </Button>
                </div>
              )}

              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags
                    .filter((tag) => !tag.toLowerCase().startsWith('series:'))
                    .map(tag => (
                    <Link key={tag} to={`/tags/${encodeURIComponent(tag)}`}>
                      <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                        {tag}
                      </span>
                    </Link>
                  ))}
                </div>

                <h1 className="text-4xl md:text-5xl mb-6 leading-tight">
                  {post.title}
                </h1>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatElapsedTimeKo(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{post.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {post.thumbnail && (
                <div className="mb-12 rounded-xl overflow-hidden">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {seriesInfo?.series && seriesInfo.posts.length > 0 && (
                <SeriesNavigator
                  series={seriesInfo.series}
                  currentPost={post}
                  posts={seriesInfo.posts}
                />
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                <ContentRenderer content={post.content} plainReadOnlyInteractive />
              </div>

              <ReactionBar
                slug={post.slug}
                heartCount={post.heartCount}
                onReact={async () => {
                  const refreshed = await blogApi.getPost(post.slug);
                  setPost(refreshed);
                }}
              />

              <RelatedPosts currentPost={post} />

              <div className="mt-16">
                <CommentSection postSlug={post.slug} />
              </div>
            </motion.div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents content={post.content} />
            </div>
          </aside>
        </div>
      </div>

      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-8 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-40"
        >
          <ArrowUp className="w-5 h-5" />
          <span className="sr-only">맨 위로</span>
        </motion.button>
      )}
    </div>
  );
}