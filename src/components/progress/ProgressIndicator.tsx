
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  value: number;
  showText?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  textClassName?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  showText = true,
  showIcon = true,
  size = 'md',
  className,
  textClassName,
}) => {
  // Determine progress color based on value
  const getProgressColor = () => {
    if (value >= 100) return 'bg-green-500';
    if (value >= 75) return 'bg-emerald-500';
    if (value >= 50) return 'bg-amber-500';
    if (value >= 25) return 'bg-orange-500';
    return 'bg-discord-brand';
  };
  
  // Determine progress height based on size
  const getProgressHeight = () => {
    switch (size) {
      case 'sm': return 'h-1.5';
      case 'lg': return 'h-3';
      case 'md':
      default: return 'h-2';
    }
  };
  
  return (
    <div className={cn("w-full", className)}>
      <Progress 
        value={value} 
        className={cn(
          "rounded-full bg-discord-sidebar-bg",
          getProgressHeight()
        )}
        indicatorClassName={getProgressColor()}
      />
      
      {showText && (
        <p className={cn(
          "text-xs text-discord-secondary-text mt-1",
          textClassName
        )}>
          {showIcon && value === 100 && (
            <span className="inline-block mr-1 text-green-500">✓</span>
          )}
          {value}% complete
        </p>
      )}
    </div>
  );
};

export default ProgressIndicator;
