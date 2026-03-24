import { Outlet } from 'react-router';
import { Header } from '../components/Header';
import { MobileNav } from '../components/MobileNav';
import { SearchModal } from '../components/SearchModal';
import { useEffect, useState, Suspense } from 'react';

export function Root() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 md:pb-8">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <MobileNav />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}