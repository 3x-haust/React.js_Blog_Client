import { createBrowserRouter } from 'react-router';
import { Root } from './pages/Root';
import { Home } from './pages/Home';
import { lazy } from 'react';
 
const PostDetail = lazy(() => import('./pages/PostDetail').then(m => ({ default: m.PostDetail })));
const Editor = lazy(() => import('./pages/Editor').then(m => ({ default: m.Editor })));
const TagPage = lazy(() => import('./pages/TagPage').then(m => ({ default: m.TagPage })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'posts/:slug', Component: PostDetail },
      { path: 'editor', Component: Editor },
      { path: 'editor/:slug', Component: Editor },
      { path: 'tags', Component: TagPage },
      { path: 'tags/:tag', Component: TagPage },
      { path: '*', Component: NotFound },
    ],
  },
]);
