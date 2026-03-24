import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { adminAuth, blogApi } from '../lib/api';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type SortType = 'latest' | 'popular';

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const CHOSEONG_INTERVAL = 588;
const CONSONANT_QUERY_REGEX = /^[ㄱ-ㅎ]+$/;
const CHOSEONG_TABLE = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

const normalizeKeyword = (value: string) => value.toLowerCase().trim();
const removeSpaces = (value: string) => value.replace(/\s+/g, '');

const toChoseong = (value: string): string => {
  return [...value]
    .map((char) => {
      const code = char.charCodeAt(0);

      if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
        return CHOSEONG_TABLE[Math.floor((code - HANGUL_BASE) / CHOSEONG_INTERVAL)];
      }

      if (code >= 0x3131 && code <= 0x314e) {
        return char;
      }

      return /\s/.test(char) ? '' : char.toLowerCase();
    })
    .join('');
};

const matchesKeyword = (target: string, keyword: string): boolean => {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  const normalizedTarget = normalizeKeyword(target);
  if (normalizedTarget.includes(normalizedKeyword)) {
    return true;
  }

  const compactKeyword = removeSpaces(normalizedKeyword);
  const compactTarget = removeSpaces(normalizedTarget);
  if (compactTarget.includes(compactKeyword)) {
    return true;
  }

  if (CONSONANT_QUERY_REGEX.test(compactKeyword)) {
    return toChoseong(target).includes(compactKeyword);
  }

  return false;
};

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortType, setSortType] = useState<SortType>('latest');
  const [isAdmin, setIsAdmin] = useState(() => adminAuth.isCachedAuthenticated());

  useEffect(() => {
    adminAuth.check().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    blogApi
      .getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      next.set('q', searchQuery);
    } else {
      next.delete('q');
    }

    if (next.toString() === searchParams.toString()) {
      return;
    }

    setSearchParams(next, { replace: true });
  }, [searchParams, searchQuery, setSearchParams]);

  const categories = useMemo(() => {
    const allTags = posts
      .flatMap((post) => post.tags)
      .filter((tag) => !tag.toLowerCase().startsWith('series:'));
    const base = ['전체', ...Array.from(new Set(allTags))];
    if (isAdmin) {
      base.push('비공개');
    }
    return base;
  }, [posts, isAdmin]);

  const hasTags = categories.length > 1;

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (selectedCategory === '비공개') {
      filtered = filtered.filter((post) => !post.isPublic);
    } else if (selectedCategory !== '전체') {
      filtered = filtered.filter((post) =>
        post.tags.includes(selectedCategory),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      if (query.startsWith('#') && query.length > 1) {
        const tagKeyword = query.slice(1);
        filtered = filtered.filter((post) =>
          post.tags.some((tag) => matchesKeyword(tag, tagKeyword)),
        );
      } else {
        filtered = filtered.filter((post) => {
          const searchableText = [
            post.title,
            ...post.tags,
            ...post.content.map((block) => block.content),
          ].join(' ');

          return matchesKeyword(searchableText, query);
        });
      }
    }

    return [...filtered].sort((a, b) => {
      if (sortType === 'popular') {
        const scoreA = a.views * 2 + a.heartCount * 5;
        const scoreB = b.views * 2 + b.heartCount * 5;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, selectedCategory, searchQuery, sortType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <p className="text-xl sm:text-2xl md:text-4xl leading-snug text-foreground max-w-5xl mx-auto break-keep">
          아이디어와 열정을
          <span className="inline-block whitespace-nowrap font-semibold bg-foreground text-background px-1 py-0 sm:px-2 sm:py-0.5 mx-1.5 sm:mx-4 align-baseline">
            남김없이 쏟아
          </span>
          <br />
          결과를 만들어내는 개발자 <span className="font-bold">유성윤</span>
          입니다.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 max-w-2xl mx-auto"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="포스트 검색..."
            className="pl-12 h-11 text-base bg-card"
          />
        </div>
      </motion.div>

      <div className="mb-5 flex justify-end">
        <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">날짜순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasTags && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="max-w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="whitespace-nowrap flex-none"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>
      )}

      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 text-muted-foreground"
        >
          <p className="text-xl">포스트가 없습니다</p>
        </motion.div>
      )}
    </div>
  );
}
