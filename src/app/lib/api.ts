import { Comment, Post, SeriesPostsResponse } from '../types';

interface ApiResponse<T> {
  statusCode: number;
  data: T | null;
  message: string[];
  timestamp: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
const ADMIN_AUTH_STORAGE = 'blog-admin-authenticated';
const VISITOR_ID_STORAGE = 'blog-visitor-id';

let refreshPromise: Promise<void> | null = null;

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const text = await response.text();

  if (!text) {
    return {
      statusCode: response.status,
      data: null,
      message: ['Empty response'],
      timestamp: new Date().toISOString(),
    };
  }

  return JSON.parse(text) as ApiResponse<T>;
};

const setAdminAuthenticated = (value: boolean): void => {
  const oldValue = localStorage.getItem(ADMIN_AUTH_STORAGE);
  const newValue = value ? '1' : '0';

  if (oldValue !== newValue) {
    localStorage.setItem(ADMIN_AUTH_STORAGE, newValue);
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { isAuthenticated: value } }));
  }
};

const tryRefreshToken = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Refresh failed');
        }
        setAdminAuthenticated(true);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const doFetch = async (retry: boolean): Promise<T> => {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    const payload = await parseResponse<T>(response);

    if (response.status === 401 && !retry && !path.startsWith('/auth/')) {
      try {
        await tryRefreshToken();
        return doFetch(true);
      } catch {
        setAdminAuthenticated(false);
      }
    }

    if (!response.ok) {
      const message = payload?.message?.join(', ') || 'Request failed';
      throw new Error(message);
    }

    return payload.data as T;
  };

  return doFetch(false);
};

export const authApi = {
  login: async (nickname: string, password: string) => {
    const data = await request<{ authenticated: boolean; nickname: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nickname, password }),
    });
    setAdminAuthenticated(true);
    return data;
  },

  refresh: async () => {
    const data = await request<{ authenticated: boolean; nickname: string }>('/auth/refresh', {
      method: 'POST',
    });
    setAdminAuthenticated(true);
    return data;
  },

  me: async () => {
    const data = await request<{ authenticated: boolean; nickname: string }>('/auth/me');
    setAdminAuthenticated(true);
    return data;
  },
};

export const adminAuth = {
  isCachedAuthenticated: () => localStorage.getItem(ADMIN_AUTH_STORAGE) === '1',

  check: async () => {
    try {
      await authApi.me();
      return true;
    } catch {
      try {
        await authApi.refresh();
        await authApi.me();
        return true;
      } catch {
        setAdminAuthenticated(false);
        return false;
      }
    }
  },

  login: async (nickname: string, password: string) => {
    await authApi.login(nickname, password);
    return true;
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    localStorage.removeItem(ADMIN_AUTH_STORAGE);
    localStorage.removeItem(VISITOR_ID_STORAGE);
    setAdminAuthenticated(false);
  },
};

export const blogApi = {
  getPosts: (query?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (query?.trim()) params.set('q', query.trim());
    if (tag?.trim()) params.set('tag', tag.trim());
    const suffix = params.toString() ? `?${params}` : '';
    return request<Post[]>(`/posts${suffix}`);
  },

  getPost: (slug: string) => request<Post>(`/posts/${encodeURIComponent(slug)}`),

  incrementView: (slug: string) => request<boolean>(`/posts/${encodeURIComponent(slug)}/view`, { method: 'POST' }),

  getRelatedPosts: (slug: string, limit = 3) =>
    request<Post[]>(`/posts/${encodeURIComponent(slug)}/related?limit=${limit}`),

  getSeriesPosts: (slug: string) =>
    request<SeriesPostsResponse>(`/posts/${encodeURIComponent(slug)}/series`),

  getTags: () => request<Array<{ tag: string; count: number }>>('/tags'),

  getComments: (slug: string) => request<Comment[]>(`/posts/${encodeURIComponent(slug)}/comments`),

  createComment: (slug: string, body: { nickname: string; avatarSeed?: string; content: string }) =>
    request<Comment>(`/posts/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createAdminReply: (slug: string, commentId: string, content: string) =>
    request<Comment>(`/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  updateComment: (slug: string, commentId: string, content: string) =>
    request<Comment>(`/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  deleteComment: (slug: string, commentId: string) =>
    request<boolean>(`/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    }),

  getHeartStatus: (slug: string, clientId: string) =>
    request<{ liked: boolean; heartCount: number }>(
      `/posts/${encodeURIComponent(slug)}/heart?clientId=${encodeURIComponent(clientId)}`,
    ),

  heartPost: (slug: string, clientId: string) =>
    request<{ heartCount: number; liked: boolean }>(`/posts/${encodeURIComponent(slug)}/heart`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    }),

  createPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'heartCount'>) =>
    request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    }),

  updatePost: (slug: string, post: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'heartCount'>>) =>
    request<Post>(`/posts/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(post),
    }),

  deletePost: (slug: string) =>
    request<boolean>(`/posts/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),

  updateVisibility: (slug: string, isPublic: boolean) =>
    request<Post>(`/posts/${encodeURIComponent(slug)}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    }),

  getDrafts: () =>
    request<any[]>('/drafts'),
  getDraft: (id: string) =>
    request<any>(`/drafts/${encodeURIComponent(id)}`),
  saveDraft: (draft: any) =>
    request<any>('/drafts', {
      method: 'POST',
      body: JSON.stringify(draft),
    }),
  deleteDraft: (id: string) =>
    request<boolean>(`/drafts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  uploadImage: async (file: File) => {
    const doUpload = async (retry: boolean): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401 && !retry) {
        try {
          await tryRefreshToken();
          return doUpload(true);
        } catch {
          setAdminAuthenticated(false);
        }
      }

      const payload = await parseResponse<{ url: string }>(response);

      if (!response.ok || !payload.data?.url) {
        const message = payload?.message?.join(', ') || '이미지 업로드에 실패했습니다.';
        throw new Error(message);
      }

      return payload.data.url.startsWith('http')
        ? payload.data.url
        : `${API_BASE}${payload.data.url}`;
    };

    return doUpload(false);
  },
};

export const visitor = {
  getId: () => {
    const existing = localStorage.getItem(VISITOR_ID_STORAGE);
    if (existing) {
      return existing;
    }

    const next =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    localStorage.setItem(VISITOR_ID_STORAGE, next);
    return next;
  },
};
