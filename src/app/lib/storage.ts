import { Post, Comment, User } from '../types';
import { samplePosts } from './mockData';

const STORAGE_KEYS = {
  POSTS: 'dev-blog-posts',
  COMMENTS: 'dev-blog-comments',
  CURRENT_USER: 'dev-blog-user',
  THEME: 'dev-blog-theme',
  DRAFT: 'dev-blog-draft',
  DRAFTS: 'dev-blog-drafts',
  INITIALIZED: 'dev-blog-initialized',
} as const;

export interface DraftPost {
  id: string;
  title: string;
  thumbnail?: string;
  tags: string[];
  content: Post['content'];
  updatedAt: string;
}

export const initializeStorage = (): void => {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(samplePosts));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
};

export const getPosts = (): Post[] => {
  initializeStorage();
  const posts = localStorage.getItem(STORAGE_KEYS.POSTS);
  return posts ? JSON.parse(posts) : [];
};

export const getPost = (slug: string): Post | undefined => {
  const posts = getPosts();
  return posts.find(p => p.slug === slug);
};

export const savePost = (post: Post): void => {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === post.id);
  
  if (index >= 0) {
    posts[index] = post;
  } else {
    posts.unshift(post);
  }
  
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
};

export const deletePost = (id: string): void => {
  const posts = getPosts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
};

export const incrementViews = (slug: string): void => {
  const posts = getPosts();
  const post = posts.find(p => p.slug === slug);
  if (post) {
    post.views += 1;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }
};

export const addReaction = (slug: string): void => {
  const posts = getPosts();
  const post = posts.find(p => p.slug === slug);
  if (post) {
    post.heartCount += 1;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }
};

export const getComments = (postId: string): Comment[] => {
  const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  const allComments: Comment[] = comments ? JSON.parse(comments) : [];
  
  const postComments = allComments.filter(c => c.postId === postId);
  const rootComments = postComments.filter(c => !c.parentId);
  
  return rootComments.map(comment => ({
    ...comment,
    replies: postComments.filter(c => c.parentId === comment.id),
  }));
};

export const saveComment = (comment: Comment): void => {
  const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  const allComments: Comment[] = comments ? JSON.parse(comments) : [];
  
  const index = allComments.findIndex(c => c.id === comment.id);
  if (index >= 0) {
    allComments[index] = comment;
  } else {
    allComments.push(comment);
  }
  
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
};

export const deleteComment = (id: string): void => {
  const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  const allComments: Comment[] = comments ? JSON.parse(comments) : [];
  const filtered = allComments.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filtered));
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const getTheme = (): 'light' | 'dark' => {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
};

export const setTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
};

const createDraftId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getLegacyDraft = (): Partial<Post> | null => {
  const draft = localStorage.getItem(STORAGE_KEYS.DRAFT);
  return draft ? JSON.parse(draft) : null;
};

const normalizeDraftPost = (post: Partial<Post>, id?: string): DraftPost => ({
  id: id ?? createDraftId(),
  title: post.title ?? '',
  thumbnail: post.thumbnail ?? '',
  tags: post.tags ?? [],
  content: post.content ?? [],
  updatedAt: new Date().toISOString(),
});

const migrateLegacyDraftIfNeeded = (): DraftPost[] => {
  const draftsRaw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
  if (draftsRaw) {
    return JSON.parse(draftsRaw) as DraftPost[];
  }

  const legacy = getLegacyDraft();
  if (!legacy) {
    return [];
  }

  const migrated = [normalizeDraftPost(legacy)];
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(migrated));
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
  return migrated;
};

export const listDrafts = (): DraftPost[] => {
  const drafts = migrateLegacyDraftIfNeeded();
  return [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const saveDraft = (post: Partial<Post>, draftId?: string): DraftPost => {
  const drafts = listDrafts();
  const normalized = normalizeDraftPost(post, draftId);
  const index = drafts.findIndex((draft) => draft.id === normalized.id);

  if (index >= 0) {
    drafts[index] = normalized;
  } else {
    drafts.unshift(normalized);
  }

  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(post));
  return normalized;
};

export const getDraft = (draftId?: string): Partial<Post> | null => {
  const drafts = listDrafts();

  if (draftId) {
    const target = drafts.find((draft) => draft.id === draftId);
    if (!target) return null;
    const { id: _id, updatedAt: _updatedAt, ...rest } = target;
    return rest;
  }

  const latest = drafts[0];
  if (!latest) {
    return null;
  }

  const { id: _id, updatedAt: _updatedAt, ...rest } = latest;
  return rest;
};

export const getDraftById = (draftId: string): DraftPost | null => {
  const drafts = listDrafts();
  return drafts.find((draft) => draft.id === draftId) ?? null;
};

export const clearDraft = (draftId?: string): void => {
  if (!draftId) {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
    localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    return;
  }

  const drafts = listDrafts().filter((draft) => draft.id !== draftId);
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));

  const nextLatest = drafts[0];
  if (nextLatest) {
    const { id: _id, updatedAt: _updatedAt, ...rest } = nextLatest;
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(rest));
  } else {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }
};

export const calculateReadingTime = (content: any[]): number => {
  const wordsPerMinute = 200;
  const totalWords = content.reduce((count, block) => {
    return count + (block.content?.split(/\s+/).length || 0);
  }, 0);
  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
};