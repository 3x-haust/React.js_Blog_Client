import { useEffect, useState } from 'react';
import { ContentBlock } from '../types';

interface TableOfContentsProps {
  content: ContentBlock[];
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  const headings = content.filter(block => block.type === 'heading');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(heading => {
      const element = document.getElementById(`heading-${heading.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(`heading-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="space-y-1">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground">목차</h3>
      {headings.map(heading => {
        const level = heading.metadata?.level || 2;
        const isActive = `heading-${heading.id}` === activeId;
        
        return (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={`block w-full text-left text-sm py-1.5 px-3 rounded transition-all ${
              isActive
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            style={{ paddingLeft: `${(level - 1) * 12 + 12}px` }}
          >
            {heading.content}
          </button>
        );
      })}
    </nav>
  );
}
