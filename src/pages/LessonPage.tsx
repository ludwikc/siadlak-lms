
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, moduleService, lessonService, progressService } from '@/lib/supabase/services';
import type { Course, Module, Lesson } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, Book, CheckCircle } from 'lucide-react';
import ContentDisplay from '@/components/content/ContentDisplay';

const LessonPage: React.FC = () => {
  const { courseSlug, moduleSlug, lessonSlug } = useParams<{
    courseSlug: string;
    moduleSlug: string;
    lessonSlug: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [completed, setCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessonDetails = async () => {
      if (!courseSlug || !moduleSlug || !lessonSlug || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await courseService.getCourseBySlug(courseSlug);
        
        if (courseError) throw courseError;
        if (!courseData) {
          setError('Course not found');
          return;
        }
        
        setCourse(courseData);
        
        // Fetch module details
        const { data: moduleData, error: moduleError } = await moduleService.getModuleBySlug(courseSlug, moduleSlug);
        
        if (moduleError) throw moduleError;
        if (!moduleData) {
          setError('Module not found');
          return;
        }
        
        setModule(moduleData);
        
        // Fetch lesson details
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
        
        // Fetch all lessons in this module
        const { data: lessonsData } = await lessonService.getLessonsByModuleId(moduleData.id);
        setRelatedLessons(lessonsData || []);
        
        // Find current index
        const index = lessonsData?.findIndex(l => l.id === lessonData.id) || -1;
        setCurrentIndex(index);
        
        // Fetch lesson progress
        const { data: progressData } = await progressService.getUserLessonProgress(user.id, lessonData.id);
        setCompleted(progressData?.completed || false);
        
        // Update progress - mark as viewed
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

  const markAsComplete = async () => {
    if (!user || !lesson) return;
    
    try {
      await progressService.updateUserProgress({
        user_id: user.id,
        lesson_id: lesson.id,
        completed: true,
        last_position: 0 // For video/audio this would be the playback position
      });
      
      setCompleted(true);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const navigateToLesson = (index: number) => {
    if (index >= 0 && index < relatedLessons.length) {
      navigate(`/courses/${courseSlug}/${moduleSlug}/${relatedLessons[index].slug}`);
    }
  };

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
    <div className="animate-fade-in">
      {/* Lesson Header */}
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
            onClick={markAsComplete}
            disabled={completed}
            className={`discord-button-primary flex items-center gap-2 ${
              completed ? 'opacity-50' : ''
            }`}
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
      
      {/* Lesson Content */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContentDisplay
            title={lesson.title}
            mediaUrl={lesson.media_url || undefined}
            mediaType={lesson.media_type}
            content={lesson.content}
            transcript={lesson.transcript || undefined}
          />
        </div>
        
        {/* Sidebar with module lessons */}
        <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
          <div className="border-b border-discord-sidebar-bg p-4">
            <h3 className="font-semibold text-discord-header-text">Module Lessons</h3>
          </div>
          
          <div className="divide-y divide-discord-sidebar-bg">
            {relatedLessons.map((relatedLesson, index) => {
              const isActive = relatedLesson.id === lesson.id;
              const isCompleted = completed && isActive; // We'd need a more complete progress tracking system
              
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
          
          {/* Discord Thread Link */}
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
    </div>
  );
};

export default LessonPage;
