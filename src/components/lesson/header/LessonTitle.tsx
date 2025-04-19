
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { Module } from '@/lib/supabase/types';

interface LessonTitleProps {
  courseSlug: string;
  moduleSlug: string;
  module: Module;
  lessonTitle: string;
}

const LessonTitle: React.FC<LessonTitleProps> = ({
  courseSlug,
  moduleSlug,
  module,
  lessonTitle,
}) => {
  return (
    <div>
      <Link
        to={`/courses/${courseSlug}/${moduleSlug}`}
        className="mb-2 flex items-center text-discord-secondary-text hover:text-discord-text"
      >
        <ChevronLeft size={16} className="mr-1" />
        <span>{module.title}</span>
      </Link>
      <h1 className="text-2xl font-bold text-discord-header-text">{lessonTitle}</h1>
    </div>
  );
};

export default LessonTitle;
