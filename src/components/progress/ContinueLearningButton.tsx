
import React from 'react';
import { useProgress } from '@/context/ProgressContext';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ContinueLearningButtonProps {
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const ContinueLearningButton: React.FC<ContinueLearningButtonProps> = ({
  className = '',
  buttonText = 'Continue Learning',
  showIcon = true,
  variant = 'primary',
  size = 'md',
  showProgress = false,
}) => {
  const { lastVisited, isLoading, coursesProgress } = useProgress();
  
  if (isLoading) {
    return (
      <Skeleton 
        className={`h-10 w-40 rounded ${className}`}
      />
    );
  }
  
  if (!lastVisited) {
    return (
      <Link 
        to="/courses" 
        className={`discord-button-${variant} ${className}`}
      >
        Explore Courses
      </Link>
    );
  }
  
  const { course, module, lesson } = lastVisited;
  const continuePath = `/courses/${course.slug}/${module.slug}/${lesson.slug}`;
  
  // Find course progress if showing progress
  const courseProgress = showProgress ? 
    coursesProgress.find(cp => cp.course.id === course.id)?.completion ?? 0 : 
    null;
  
  const sizeClassMap = {
    sm: 'text-sm py-1 px-3',
    md: 'py-2 px-4',
    lg: 'text-lg py-3 px-6'
  };
  
  const sizeClass = sizeClassMap[size] || sizeClassMap.md;
  
  return (
    <div className="flex flex-col">
      <Link 
        to={continuePath} 
        className={`discord-button-${variant} ${sizeClass} flex items-center gap-2 ${className}`}
      >
        <span>{buttonText}</span>
        {showIcon && <ChevronRight size={16} />}
      </Link>
      
      {showProgress && courseProgress !== null && (
        <div className="mt-2 w-full bg-discord-sidebar-bg rounded-full h-1.5">
          <div 
            className="bg-discord-brand h-1.5 rounded-full" 
            style={{ width: `${courseProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ContinueLearningButton;
