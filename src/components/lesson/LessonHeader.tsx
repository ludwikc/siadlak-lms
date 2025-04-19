import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, CheckCircle } from 'lucide-react';
import type { Module } from '@/lib/supabase/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      
      <div className="mt-4 flex items-center gap-2 md:mt-0">
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex <= 0}
          className={`rounded-md border border-discord-sidebar-bg p-2 ${
            currentIndex <= 0
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-discord-sidebar-bg'
          }`}
          aria-label="Previous lesson"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          onClick={onToggleCompletion}
          className={`discord-button-${completed ? 'secondary' : 'primary'} flex items-center gap-2`}
        >
          {completed ? (
            <>
              <CheckCircle size={18} />
              <span>Completed</span>
            </>
          ) : (
            <>
              <span>Mark as Complete</span>
            </>
          )}
        </button>
        
        {isMediaLesson && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-md border border-discord-sidebar-bg p-2 hover:bg-discord-sidebar-bg"
                aria-label="Playback settings"
              >
                <Settings size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(speed => (
                <DropdownMenuItem 
                  key={speed} 
                  onClick={() => onSpeedChange(speed)}
                  className={playbackSpeed === speed ? 'bg-discord-sidebar-bg' : ''}
                >
                  {speed}x {playbackSpeed === speed && '✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex >= relatedLessons.length - 1}
          className={`rounded-md border border-discord-sidebar-bg p-2 ${
            currentIndex >= relatedLessons.length - 1
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-discord-sidebar-bg'
          }`}
          aria-label="Next lesson"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default LessonHeader;
