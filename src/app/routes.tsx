import { createBrowserRouter } from 'react-router';
import { Root } from './pages/Root';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { Editor } from './pages/Editor';
import { TagPage } from './pages/TagPage';
import { NotFound } from './pages/NotFound';
import { useEffect } from 'react';
 
function SitemapRedirect() {
  useEffect(() => {
    window.location.href = 'https://api-blog.3xhaust.dev/sitemap.xml';
  }, []);
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'posts/:slug', Component: PostDetail },
      { path: 'sitemap.xml', Component: SitemapRedirect },
      { path: 'editor', Component: Editor },
      { path: 'editor/:slug', Component: Editor },
      { path: 'tags', Component: TagPage },
      { path: 'tags/:tag', Component: TagPage },
      { path: '*', Component: NotFound },
    ],
  },
]);
