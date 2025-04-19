
import React from 'react';
import { useProgress } from '@/context/ProgressContext';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface ContinueLearningButtonProps {
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const ContinueLearningButton: React.FC<ContinueLearningButtonProps> = ({
  className = '',
  buttonText = 'Continue Learning',
  showIcon = true,
  variant = 'primary',
  size = 'md',
}) => {
  const { lastVisited, isLoading } = useProgress();
  
  if (isLoading) {
    return (
      <button 
        disabled
        className={`discord-button-${variant} opacity-70 animate-pulse ${className}`}
      >
        {buttonText}
      </button>
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
  
  const sizeClassMap = {
    sm: 'text-sm py-1 px-3',
    md: 'py-2 px-4',
    lg: 'text-lg py-3 px-6'
  };
  
  const sizeClass = sizeClassMap[size] || sizeClassMap.md;
  
  return (
    <Link 
      to={continuePath} 
      className={`discord-button-${variant} ${sizeClass} flex items-center gap-2 ${className}`}
    >
      <span>{buttonText}</span>
      {showIcon && <ChevronRight size={16} />}
    </Link>
  );
};

export default ContinueLearningButton;
