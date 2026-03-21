import { useEffect, useState } from 'react';
import { Home, Tag, PenSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { adminAuth } from '../lib/api';

export function MobileNav() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(adminAuth.isCachedAuthenticated());

  useEffect(() => {
    adminAuth.check().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        <Link
          to="/"
          className={`flex flex-col items-center space-y-1 px-4 py-2 transition-colors ${
            isActive('/') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">홈</span>
        </Link>

        <Link
          to="/tags"
          className={`flex flex-col items-center space-y-1 px-4 py-2 transition-colors ${
            isActive('/tags') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-xs">태그</span>
        </Link>

        {isAdmin && (
          <Link
            to="/editor"
            className={`flex flex-col items-center space-y-1 px-4 py-2 transition-colors ${
              isActive('/editor') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <PenSquare className="w-5 h-5" />
            <span className="text-xs">에디터</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
