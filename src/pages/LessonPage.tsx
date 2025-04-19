import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, moduleService, lessonService } from '@/lib/supabase/services';
import type { Course, Module, Lesson } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { usePreferences } from '@/context/PreferencesContext';
import { ChevronLeft, ChevronRight, Book, CheckCircle, Settings } from 'lucide-react';
import EnhancedContentDisplay from '@/components/content/EnhancedContentDisplay';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LessonPage: React.FC = () => {
  const { courseSlug, moduleSlug, lessonSlug } = useParams<{
    courseSlug: string;
    moduleSlug: string;
    lessonSlug: string;
  }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { markLessonComplete, updatePlaybackPosition, trackMediaProgress, markTextLessonComplete } = useProgress();
  const { preferences, setVideoSpeed } = usePreferences();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [completed, setCompleted] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  
  const handleContentScroll = () => {
    if (!contentRef.current || lesson?.media_type !== 'text') return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= 0.9 && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      markTextLessonComplete(lesson.id);
    }
    
    updatePlaybackPosition(lesson.id, scrollPercentage > 1 ? 1 : scrollPercentage);
  };

  useEffect(() => {
    const fetchLessonDetails = async () => {
      if (!courseSlug || !moduleSlug || !lessonSlug || !user) return;
      
      try {
        setIsLoading(true);
        
        const { data: courseData, error: courseError } = await courseService.getCourseBySlug(courseSlug);
        
        if (courseError) throw courseError;
        if (!courseData) {
          setError('Course not found');
          return;
        }
        
        setCourse(courseData);
        
        const { data: moduleData, error: moduleError } = await moduleService.getModuleBySlug(courseSlug, moduleSlug);
        
        if (moduleError) throw moduleError;
        if (!moduleData) {
          setError('Module not found');
          return;
        }
        
        setModule(moduleData);
        
        const { data: lessonData, error: lessonError } = await lessonService.getLessonBySlug(
          courseSlug,
          moduleSlug,
          lessonSlug
        );
        
        if (lessonError) throw lessonError;
        if (!lessonData) {
          setError('Lesson not found');
          return;
        }
        
        setLesson(lessonData);
        
        const { data: lessonsData } = await lessonService.getLessonsByModuleId(moduleData.id);
        setRelatedLessons(lessonsData || []);
        
        const index = lessonsData?.findIndex(l => l.id === lessonData.id) || -1;
        setCurrentIndex(index);
        
        const { data: progressData } = await progressService.getUserLessonProgress(user.id, lessonData.id);
        setCompleted(progressData?.completed || false);
        
        if (progressData?.last_position) {
          setPlaybackPosition(progressData.last_position);
        }
        
        await progressService.updateUserProgress({
          user_id: user.id,
          lesson_id: lessonData.id,
          completed: progressData?.completed || false,
          last_position: progressData?.last_position || 0
        });
        
      } catch (err) {
        console.error('Error fetching lesson details:', err);
        setError('Failed to load lesson. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonDetails();
  }, [courseSlug, moduleSlug, lessonSlug, user]);

  const toggleCompletion = async () => {
    if (!user || !lesson) return;
    
    try {
      await markLessonComplete(lesson.id, !completed);
      setCompleted(!completed);
    } catch (err) {
      console.error('Error updating completion status:', err);
    }
  };

  const handleMediaProgress = (position: number, duration: number) => {
    if (!user || !lesson) return;
    trackMediaProgress(lesson.id, position, duration);
  };

  const navigateToLesson = (index: number) => {
    if (index >= 0 && index < relatedLessons.length) {
      navigate(`/courses/${courseSlug}/${moduleSlug}/${relatedLessons[index].slug}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        navigateToLesson(currentIndex - 1);
      }
      
      if (e.key === 'ArrowRight' && currentIndex < relatedLessons.length - 1) {
        navigateToLesson(currentIndex + 1);
      }
      
      if (e.key === ' ' && (lesson?.media_type === 'video' || lesson?.media_type === 'audio')) {
        e.preventDefault();
      }
      
      if (e.key === 'm') {
        toggleCompletion();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, relatedLessons, lesson]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  if (error || !lesson || !module || !course) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-discord-header-text">
            {error || 'Lesson not found'}
          </h2>
          <p className="mb-6 text-discord-secondary-text">
            The lesson you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link to={`/courses/${courseSlug}`} className="discord-button-secondary">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" ref={lesson.media_type === 'text' ? contentRef : undefined} onScroll={handleContentScroll}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to={`/courses/${courseSlug}/${moduleSlug}`}
            className="mb-2 flex items-center text-discord-secondary-text hover:text-discord-text"
          >
            <ChevronLeft size={16} className="mr-1" />
            <span>{module.title}</span>
          </Link>
          <h1 className="text-2xl font-bold text-discord-header-text">{lesson.title}</h1>
        </div>
        
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <button
            onClick={() => navigateToLesson(currentIndex - 1)}
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
            onClick={toggleCompletion}
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
          
          {(lesson.media_type === 'video' || lesson.media_type === 'audio') && (
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
                    onClick={() => setVideoSpeed(speed)}
                    className={preferences.videoPlaybackSpeed === speed ? 'bg-discord-sidebar-bg' : ''}
                  >
                    {speed}x {preferences.videoPlaybackSpeed === speed && '✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <button
            onClick={() => navigateToLesson(currentIndex + 1)}
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
      
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EnhancedContentDisplay
            title={lesson.title}
            mediaUrl={lesson.media_url || undefined}
            mediaType={lesson.media_type}
            content={lesson.content}
            transcript={lesson.transcript || undefined}
            playbackSpeed={preferences.videoPlaybackSpeed}
            initialPosition={playbackPosition}
            onProgress={handleMediaProgress}
          />
          
          <div className="mt-8 flex items-center justify-between lg:hidden">
            <button
              onClick={() => navigateToLesson(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className={`discord-button-secondary ${currentIndex <= 0 ? 'invisible' : ''}`}
            >
              Previous Lesson
            </button>
            
            <button
              onClick={() => navigateToLesson(currentIndex + 1)}
              disabled={currentIndex >= relatedLessons.length - 1}
              className={`discord-button-primary ${currentIndex >= relatedLessons.length - 1 ? 'invisible' : ''}`}
            >
              Next Lesson
            </button>
          </div>
        </div>
        
        <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
          <div className="border-b border-discord-sidebar-bg p-4">
            <h3 className="font-semibold text-discord-header-text">Module Lessons</h3>
          </div>
          
          <div className="divide-y divide-discord-sidebar-bg max-h-[500px] overflow-y-auto">
            {relatedLessons.map((relatedLesson, index) => {
              const isActive = relatedLesson.id === lesson.id;
              const isCompleted = completed && isActive;
              
              return (
                <Link
                  key={relatedLesson.id}
                  to={`/courses/${courseSlug}/${moduleSlug}/${relatedLesson.slug}`}
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
                      {relatedLesson.title}
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
      </div>
      
      {currentIndex < relatedLessons.length - 1 && (
        <div className="mt-8 hidden items-center justify-end lg:flex">
          <button
            onClick={() => navigateToLesson(currentIndex + 1)}
            className="discord-button-primary flex items-center gap-2"
          >
            <span>Next Lesson: {relatedLessons[currentIndex + 1].title}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default LessonPage;
