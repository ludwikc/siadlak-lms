import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { courseService, moduleService, lessonService, progressService } from '@/lib/supabase/services';
import type { Course, Module, Lesson } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { usePreferences } from '@/context/PreferencesContext';
import EnhancedContentDisplay from '@/components/content/EnhancedContentDisplay';
import LessonHeader from '@/components/lesson/LessonHeader';
import LessonNavigation from '@/components/lesson/LessonNavigation';
import LessonsSidebar from '@/components/lesson/LessonsSidebar';

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

  const isMediaLesson = lesson.media_type === 'video' || lesson.media_type === 'audio';

  return (
    <div 
      className="animate-fade-in" 
      ref={lesson.media_type === 'text' ? contentRef : undefined}
      onScroll={handleContentScroll}
    >
      <LessonHeader
        courseSlug={courseSlug!}
        moduleSlug={moduleSlug!}
        module={module}
        lessonTitle={lesson.title}
        completed={completed}
        currentIndex={currentIndex}
        relatedLessons={relatedLessons}
        isMediaLesson={isMediaLesson}
        playbackSpeed={preferences.videoPlaybackSpeed}
        onNavigate={navigateToLesson}
        onToggleCompletion={toggleCompletion}
        onSpeedChange={setVideoSpeed}
      />
      
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
          
          <LessonNavigation
            courseSlug={courseSlug!}
            moduleSlug={moduleSlug!}
            currentIndex={currentIndex}
            nextLesson={relatedLessons[currentIndex + 1]}
            relatedLessons={relatedLessons}
            onNavigate={navigateToLesson}
          />
        </div>
        
        <div>
          <LessonsSidebar
            courseSlug={courseSlug!}
            moduleSlug={moduleSlug!}
            currentLessonId={lesson.id}
            module={module}
            lessons={relatedLessons}
            completed={completed}
          />
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
