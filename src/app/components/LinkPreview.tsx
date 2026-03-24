import React, { useEffect, useState } from 'react';
import { blogApi } from '../lib/api';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { AspectRatio } from './ui/aspect-ratio';
import { ExternalLink } from 'lucide-react';

interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export function LinkPreview({ url, className = '' }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getMetadata(url);
        if (isMounted) {
          setMetadata(data);
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <Card className={`overflow-hidden my-6 max-w-2xl ${className}`}>
        <div className="flex flex-col sm:flex-row h-auto sm:h-32">
          <div className="w-full sm:w-48 h-32 sm:h-full shrink-0">
            <Skeleton className="h-full w-full" />
          </div>
          <CardContent className="p-4 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </div>
      </Card>
    );
  }

  if (error || !metadata) {
    return (
      <div className={`my-6 ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-primary/70 decoration-2 underline-offset-4 hover:decoration-primary font-medium flex items-center gap-1"
        >
          {url}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`block my-6 no-underline transition-all hover:scale-[1.01] active:scale-[0.99] group max-w-2xl ${className}`}
    >
      <Card className="overflow-hidden border border-border/60 hover:border-primary/50 bg-card hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col sm:flex-row h-auto sm:h-32">
          {metadata.image && (
            <div className="w-full sm:w-48 h-32 sm:h-full shrink-0 border-b sm:border-b-0 sm:border-r border-border/40 overflow-hidden">
              <img
                src={metadata.image}
                alt={metadata.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <CardContent className="p-4 flex flex-col justify-between overflow-hidden">
            <div className="space-y-1">
              <h4 className="font-bold text-base leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {metadata.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                {metadata.description}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {metadata.siteName}
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                {new URL(url).hostname}
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    </a>
  );
}
