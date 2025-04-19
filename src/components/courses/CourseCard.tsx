
import React from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '@/lib/supabase/types';
import ProgressIndicator from '@/components/progress/ProgressIndicator';

interface CourseCardProps {
  course: Course;
  progress?: number;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  progress = 0,
  className = ''
}) => {
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;
  const isNotStarted = progress === 0;
  
  const statusIndicator = () => {
    if (isCompleted) {
      return (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
          Completed
        </div>
      );
    }
    
    if (isInProgress) {
      return (
        <div className="absolute top-2 right-2 bg-discord-brand text-white text-xs px-2 py-1 rounded-full z-10">
          In Progress
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Link 
      to={`/courses/${course.slug}`}
      className={`group overflow-hidden rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg transition-all duration-300 hover:border-discord-brand ${className}`}
    >
      <div className="relative aspect-video overflow-hidden">
        {statusIndicator()}
        
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-discord-sidebar-bg">
            <span className="text-discord-secondary-text">No thumbnail</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="mb-2 font-semibold text-discord-header-text">{course.title}</h3>
        <p className="line-clamp-2 mb-3 text-sm text-discord-secondary-text">
          {course.description}
        </p>
        
        {(isCompleted || isInProgress) && (
          <ProgressIndicator value={progress} size="sm" />
        )}
        
        {isNotStarted && (
          <div className="text-xs text-discord-secondary-text">
            Not started yet
          </div>
        )}
      </div>
    </Link>
  );
};

export default CourseCard;
