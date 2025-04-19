
import React from 'react';
import { ChevronLeft, ChevronRight, Settings, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LessonActionsProps {
  completed: boolean;
  currentIndex: number;
  relatedLessons: any[];
  isMediaLesson?: boolean;
  playbackSpeed?: number;
  onNavigate: (index: number) => void;
  onToggleCompletion: () => void;
  onSpeedChange: (speed: number) => void;
}

const LessonActions: React.FC<LessonActionsProps> = ({
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
  );
};

export default LessonActions;
