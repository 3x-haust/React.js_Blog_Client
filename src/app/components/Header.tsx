import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Moon, Sun, Search, PenSquare, LogOut, LogIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { adminAuth } from '../lib/api';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(adminAuth.isCachedAuthenticated());
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [adminNickname, setAdminNickname] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isAuthenticated: boolean }>;
      if (typeof customEvent.detail.isAuthenticated === 'boolean') {
        setIsAdmin(customEvent.detail.isAuthenticated);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);

    adminAuth.check().then(setIsAdmin).catch(() => setIsAdmin(false));

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') || '');
  }, [location.search]);

  const updateSearch = (value: string) => {
    setQuery(value);
    const keyword = value.trim();

    if (!keyword) {
      navigate('/');
      return;
    }

    navigate(`/?q=${encodeURIComponent(keyword)}`);
  };

  const handleAdminLogin = async () => {
    if (!adminNickname.trim() || !adminPassword.trim()) return;
    
    setIsLoggingIn(true);
    try {
      await adminAuth.login(adminNickname.trim(), adminPassword);
      setIsAdmin(true);
      setAdminNickname('');
      setAdminPassword('');
      setShowLoginDialog(false);
    } catch {
      alert('관리자 로그인에 실패했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await adminAuth.logout();
    setIsAdmin(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          <Link to="/" className="flex items-center shrink-0">
            <span className="text-2xl font-semibold">3xhaust.log</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 ml-auto">
            <form>
              <div className="relative w-52 lg:w-60">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => updateSearch(e.target.value)}
                  placeholder="포스트 검색..."
                  className="pl-9 h-8"
                />
              </div>
            </form>

            <Link to="/tags" className="text-foreground/70 hover:text-foreground transition-colors">
              태그
            </Link>
            {isAdmin && (
              <Link to="/editor" className="text-foreground/70 hover:text-foreground transition-colors">
                에디터
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-transform hover:rotate-180 duration-500"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden ml-auto">
            {isAdmin && (
              <Link to="/editor">
                <Button variant="ghost" size="icon">
                  <PenSquare className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>관리자 로그인</AlertDialogTitle>
            <AlertDialogDescription>
              관리자 계정으로 로그인하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">닉네임</label>
              <Input
                value={adminNickname}
                onChange={(e) => setAdminNickname(e.target.value)}
                placeholder="관리자 닉네임"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">비밀번호</label>
              <Input
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="관리자 비밀번호"
                type="password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && adminNickname.trim() && adminPassword.trim()) {
                    handleAdminLogin();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminLogin}
              disabled={!adminNickname.trim() || !adminPassword.trim() || isLoggingIn}
            >
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
