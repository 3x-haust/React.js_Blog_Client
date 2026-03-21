import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { blogApi } from '../lib/api';
import { Post } from '../types';
import { ScrollArea } from './ui/scroll-area';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    blogApi.getPosts().then(setPosts).catch(() => setPosts([]));
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      post.content.some(block => block.content.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  }, [query, posts]);

  const handleSelect = (slug: string) => {
    navigate(`/posts/${slug}`);
    onClose();
    setQuery('');
  };

  const highlightText = (text: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-accent/30 text-accent-foreground">{part}</mark>
        : part
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogTitle className="sr-only">포스트 검색</DialogTitle>
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="포스트 검색... (제목, 태그, 내용)"
            className="border-0 focus-visible:ring-0 text-lg h-14"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map(post => (
                <button
                  key={post.id}
                  onClick={() => handleSelect(post.slug)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-medium mb-1">{highlightText(post.title)}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                    <span>·</span>
                    <div className="flex gap-1">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              검색어를 입력하세요
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
