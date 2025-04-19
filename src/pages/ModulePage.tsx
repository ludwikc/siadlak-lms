
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService, moduleService, lessonService } from '@/lib/supabase/services';
import type { Course, Module, Lesson } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { Book, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const ModulePage: React.FC = () => {
  const { courseSlug, moduleSlug } = useParams<{
    courseSlug: string;
    moduleSlug: string;
  }>();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModuleDetails = async () => {
      if (!courseSlug || !moduleSlug || !user) return;
      
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
        
        // Fetch all lessons in this module
        const { data: lessonsData, error: lessonsError } = await lessonService.getLessonsByModuleId(moduleData.id);
        
        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);
        
      } catch (err) {
        console.error('Error fetching module details:', err);
        setError('Failed to load module. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleDetails();
  }, [courseSlug, moduleSlug, user]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  if (error || !module || !course) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-discord-header-text">
            {error || 'Module not found'}
          </h2>
          <p className="mb-6 text-discord-secondary-text">
            The module you're looking for doesn't exist or you don't have access to it.
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
      {/* Module Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to={`/courses/${courseSlug}`}
            className="mb-2 flex items-center text-discord-secondary-text hover:text-discord-text"
          >
            <ChevronLeft size={16} className="mr-1" />
            <span>Back to Course</span>
          </Link>
          <h1 className="text-3xl font-bold text-discord-header-text">{module.title}</h1>
        </div>
        
        {module.discord_thread_url && (
          <a
            href={module.discord_thread_url}
            target="_blank"
            rel="noopener noreferrer"
            className="discord-button-secondary mt-4 flex items-center gap-2 md:mt-0"
          >
            <Book size={18} />
            <span>Discord Thread</span>
          </a>
        )}
      </div>
      
      {/* Lessons List */}
      <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
        <div className="border-b border-discord-sidebar-bg p-4">
          <h2 className="text-xl font-semibold text-discord-header-text">Module Lessons</h2>
        </div>
        
        {lessons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-discord-secondary-text">No lessons available for this module yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-discord-sidebar-bg">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                to={`/courses/${courseSlug}/${moduleSlug}/${lesson.slug}`}
                className="group flex items-center justify-between p-4 transition-colors hover:bg-discord-sidebar-bg/50"
              >
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-discord-brand text-white">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-discord-header-text">{lesson.title}</h3>
                    <p className="text-sm text-discord-secondary-text">
                      {lesson.media_type === 'video' && 'Video Lesson'}
                      {lesson.media_type === 'audio' && 'Audio Lesson'}
                      {lesson.media_type === 'text' && 'Text Lesson'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-discord-secondary-text transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Link
          to={`/courses/${courseSlug}`}
          className="flex items-center gap-2 text-discord-secondary-text hover:text-discord-text"
        >
          <ChevronLeft size={18} />
          <span>Back to Course</span>
        </Link>
        
        {lessons.length > 0 && (
          <Link
            to={`/courses/${courseSlug}/${moduleSlug}/${lessons[0].slug}`}
            className="discord-button-primary"
          >
            Start First Lesson
          </Link>
        )}
      </div>
    </div>
  );
};

export default ModulePage;
