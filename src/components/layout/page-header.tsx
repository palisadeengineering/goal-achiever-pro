'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  actions,
  children,
  icon,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 pb-4 md:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push(backHref)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {icon && <div className="text-primary shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{title}</h1>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
