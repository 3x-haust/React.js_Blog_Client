export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'checklist'
  | 'table'
  | 'link'
  | 'code'
  | 'image'
  | 'iframe'
  | 'divider'
  | 'quote'
  | 'callout'
  | 'math'
  | 'interactive'
  | 'linebreak';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    level?: 1 | 2 | 3;
    language?: string;
    url?: string;
    linkText?: string;
    listStyle?: 'unordered' | 'ordered';
    alt?: string;
    variant?: 'info' | 'warning' | 'success' | 'error';
    height?: number;
    title?: string;
    editable?: boolean | 'restricted';
    editableLines?: number[];
    scope?: string;
  };
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  thumbnail?: string;
  tags: string[];
  content: ContentBlock[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
  heartCount: number;
  readingTime: number;
}

export interface Comment {
  id: string;
  postId: string;
  nickname: string;
  avatarSeed?: string | null;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  edited: boolean;
  isAdminReply?: boolean;
  replies?: Comment[];
}

export interface User {
  id: string;
  username: string;
  avatar: string;
}

export interface SeriesPostsResponse {
  series: string | null;
  posts: Post[];
}