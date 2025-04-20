
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionOnClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionOnClick,
  secondaryActionLabel,
  secondaryActionOnClick,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center",
      className
    )}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-discord-header-text">{title}</h3>
      {description && <p className="mt-2 text-sm text-discord-secondary-text">{description}</p>}
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {actionLabel && (
            <Button onClick={actionOnClick}>
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && (
            <Button variant="outline" onClick={secondaryActionOnClick}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
