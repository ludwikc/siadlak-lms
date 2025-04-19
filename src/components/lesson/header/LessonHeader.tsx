
import React from 'react';
import LessonTitle from './LessonTitle';
import LessonActions from './LessonActions';
import type { Module } from '@/lib/supabase/types';

interface LessonHeaderProps {
  courseSlug: string;
  moduleSlug: string;
  module: Module;
  lessonTitle: string;
  completed: boolean;
  currentIndex: number;
  relatedLessons: any[];
  isMediaLesson?: boolean;
  playbackSpeed?: number;
  onNavigate: (index: number) => void;
  onToggleCompletion: () => void;
  onSpeedChange: (speed: number) => void;
}

const LessonHeader: React.FC<LessonHeaderProps> = ({
  courseSlug,
  moduleSlug,
  module,
  lessonTitle,
  completed,
  currentIndex,
  relatedLessons,
  isMediaLesson,
  playbackSpeed,
  onNavigate,
  onToggleCompletion,
  onSpeedChange,
}) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
      <LessonTitle 
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        module={module}
        lessonTitle={lessonTitle}
      />
      
      <LessonActions
        completed={completed}
        currentIndex={currentIndex}
        relatedLessons={relatedLessons}
        isMediaLesson={isMediaLesson}
        playbackSpeed={playbackSpeed}
        onNavigate={onNavigate}
        onToggleCompletion={onToggleCompletion}
        onSpeedChange={onSpeedChange}
      />
    </div>
  );
};

export default LessonHeader;
