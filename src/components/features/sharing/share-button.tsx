'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { ShareDialog } from './share-dialog';
import type { TabName, EntityType } from '@/types/sharing';

interface ShareButtonProps {
  tabName?: TabName;
  entityType?: EntityType;
  entityId?: string;
  entityTitle?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareButton({
  tabName,
  entityType,
  entityId,
  entityTitle,
  variant = 'outline',
  size = 'sm',
  className,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <ShareDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        tabName={tabName}
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
      />
    </>
  );
}
