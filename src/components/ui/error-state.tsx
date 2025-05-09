import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { AlertTriangle, XOctagon, Info, RefreshCw, LucideIcon } from 'lucide-react';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorStateProps {
  title: string;
  message?: string;
  severity?: ErrorSeverity;
  retryLabel?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode; // Add support for custom icon
}

export function ErrorState({
  title,
  message,
  severity = 'error',
  retryLabel = 'Try Again',
  onRetry,
  actionLabel,
  onAction,
  className,
  icon, // Add the icon prop
}: ErrorStateProps) {
  const getIcon = () => {
    // If a custom icon is provided, use it
    if (icon) return icon;
    
    // Otherwise use the default icon based on severity
    switch (severity) {
      case 'error':
        return <XOctagon className="h-12 w-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      case 'info':
        return <Info className="h-12 w-12 text-blue-500" />;
    }
  };

  const getContainerColor = () => {
    switch (severity) {
      case 'error':
        return 'border-red-900/20 bg-red-950/10';
      case 'warning':
        return 'border-yellow-900/20 bg-yellow-950/10';
      case 'info':
        return 'border-blue-900/20 bg-blue-950/10';
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg border p-8 text-center",
      getContainerColor(),
      className
    )}>
      <div className="mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold text-discord-header-text">{title}</h3>
      {message && <p className="mt-2 text-sm text-discord-secondary-text">{message}</p>}
      
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}
        
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
