
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/lib/supabase/types';

interface LessonNavigationProps {
  courseSlug: string;
  moduleSlug: string;
  currentIndex: number;
  nextLesson?: Lesson;
  relatedLessons: Lesson[];
  onNavigate: (index: number) => void;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  courseSlug,
  moduleSlug,
  currentIndex,
  nextLesson,
  relatedLessons,
  onNavigate,
}) => {
  return (
    <>
      <div className="mt-8 flex items-center justify-between lg:hidden">
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex <= 0}
          className={`discord-button-secondary ${currentIndex <= 0 ? 'invisible' : ''}`}
        >
          Previous Lesson
        </button>
        
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex >= relatedLessons.length - 1}
          className={`discord-button-primary ${currentIndex >= relatedLessons.length - 1 ? 'invisible' : ''}`}
        >
          Next Lesson
        </button>
      </div>
      
      {nextLesson && (
        <div className="mt-8 hidden items-center justify-end lg:flex">
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="discord-button-primary flex items-center gap-2"
          >
            <span>Next Lesson: {nextLesson.title}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
};

export default LessonNavigation;
