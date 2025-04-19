
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, CheckCircle } from 'lucide-react';
import type { Lesson, Module } from '@/lib/supabase/types';

interface LessonsSidebarProps {
  courseSlug: string;
  moduleSlug: string;
  currentLessonId: string;
  module: Module;
  lessons: Lesson[];
  completed: boolean;
}

const LessonsSidebar: React.FC<LessonsSidebarProps> = ({
  courseSlug,
  moduleSlug,
  currentLessonId,
  module,
  lessons,
  completed,
}) => {
  return (
    <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
      <div className="border-b border-discord-sidebar-bg p-4">
        <h3 className="font-semibold text-discord-header-text">Module Lessons</h3>
      </div>
      
      <div className="divide-y divide-discord-sidebar-bg max-h-[500px] overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isActive = lesson.id === currentLessonId;
          const isCompleted = completed && isActive;
          
          return (
            <Link
              key={lesson.id}
              to={`/courses/${courseSlug}/${moduleSlug}/${lesson.slug}`}
              className={`flex items-center p-4 transition-colors ${
                isActive
                  ? 'bg-discord-sidebar-bg'
                  : 'hover:bg-discord-sidebar-bg/50'
              }`}
            >
              <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-discord-brand text-xs font-medium text-white">
                {isCompleted ? <CheckCircle size={14} /> : index + 1}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  isActive ? 'text-discord-header-text' : 'text-discord-secondary-text'
                }`}>
                  {lesson.title}
                </h4>
              </div>
            </Link>
          );
        })}
      </div>
      
      {module.discord_thread_url && (
        <div className="border-t border-discord-sidebar-bg p-4">
          <a
            href={module.discord_thread_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-discord-secondary-text hover:text-discord-cta"
          >
            <Book size={18} />
            <span>Join Discord Discussion</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default LessonsSidebar;
