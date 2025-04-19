
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, moduleService } from '@/lib/supabase/services';
import type { Course, Module } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { Book, ChevronRight, CheckCircle } from 'lucide-react';
import ProgressIndicator from '@/components/progress/ProgressIndicator';

const CourseDetailsPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coursesProgress, lastVisited } = useProgress();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [courseProgress, setCourseProgress] = useState<number>(0);
  const [modulesProgress, setModulesProgress] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseSlug || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await courseService.getCourseBySlug(courseSlug);
        
        if (courseError) {
          throw courseError;
        }
        
        if (!courseData) {
          setError('Course not found');
          return;
        }
        
        setCourse(courseData);
        
        // Fetch modules for the course
        const { data: modulesData, error: modulesError } = await moduleService.getModulesByCourseId(courseData.id);
        
        if (modulesError) {
          throw modulesError;
        }
        
        setModules(modulesData || []);
        
        // Set course progress from context
        const courseProgressInfo = coursesProgress.find(cp => cp.course.id === courseData.id);
        if (courseProgressInfo) {
          setCourseProgress(courseProgressInfo.completion);
          
          // Calculate module progress
          if (courseProgressInfo.progress && courseProgressInfo.progress.length > 0) {
            const moduleProgressMap: {[key: string]: {total: number, completed: number}} = {};
            
            // Initialize module progress tracking
            modulesData?.forEach(module => {
              moduleProgressMap[module.id] = { total: 0, completed: 0 };
            });
            
            // Count lessons and completed lessons per module
            courseProgressInfo.progress.forEach(progress => {
              // We need to find which module this lesson belongs to
              const lesson = progress.lesson_id;
              const lessonModule = modulesData?.find(m => 
                m.lessons?.some(l => l.id === lesson)
              );
              
              if (lessonModule && moduleProgressMap[lessonModule.id]) {
                moduleProgressMap[lessonModule.id].total += 1;
                if (progress.completed) {
                  moduleProgressMap[lessonModule.id].completed += 1;
                }
              }
            });
            
            // Convert to percentages
            const percentageMap: {[key: string]: number} = {};
            Object.entries(moduleProgressMap).forEach(([moduleId, counts]) => {
              percentageMap[moduleId] = counts.total > 0 
                ? Math.round((counts.completed / counts.total) * 100) 
                : 0;
            });
            
            setModulesProgress(percentageMap);
          }
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseSlug, user, coursesProgress]);

  // Function to determine the next action button
  const renderActionButton = () => {
    if (!course) return null;
    
    // Check if this is the last visited course
    const isLastVisited = lastVisited && lastVisited.course.id === course.id;
    
    if (isLastVisited) {
      // Continue from last position
      const { module, lesson } = lastVisited;
      return (
        <button
          onClick={() => navigate(`/courses/${courseSlug}/${module.slug}/${lesson.slug}`)}
          className="discord-button-primary flex items-center gap-2"
        >
          <span>Continue Learning</span>
          <ChevronRight size={16} />
        </button>
      );
    } else if (modules.length > 0) {
      // Start or continue course
      return (
        <button
          onClick={() => navigate(`/courses/${courseSlug}/${modules[0].slug}`)}
          className="discord-button-primary"
        >
          {courseProgress > 0 ? 'Continue Course' : 'Start Learning'}
        </button>
      );
    }
    
    return (
      <button disabled className="discord-button-primary opacity-50">
        No Modules Available
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-discord-header-text">
            {error || 'Course not found'}
          </h2>
          <p className="mb-6 text-discord-secondary-text">
            The course you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link to="/courses" className="discord-button-secondary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl">
      {/* Course Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-discord-header-text">{course.title}</h1>
          <p className="max-w-2xl text-discord-secondary-text">{course.description}</p>
          
          {/* Overall progress */}
          {courseProgress > 0 && (
            <div className="mt-4 max-w-md">
              <ProgressIndicator value={courseProgress} />
            </div>
          )}
        </div>
        {renderActionButton()}
      </div>
      
      {/* Course Thumbnail */}
      {course.thumbnail_url && (
        <div className="mb-8 overflow-hidden rounded-lg border border-discord-sidebar-bg">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full object-cover"
          />
        </div>
      )}
      
      {/* Modules List */}
      <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
        <div className="border-b border-discord-sidebar-bg p-4">
          <h2 className="text-xl font-semibold text-discord-header-text">Course Content</h2>
        </div>
        
        {modules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-discord-secondary-text">No modules available for this course yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-discord-sidebar-bg">
            {modules.map((module, index) => {
              const moduleProgress = modulesProgress[module.id] || 0;
              const isCompleted = moduleProgress === 100;
              
              return (
                <div key={module.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted ? 'bg-green-500' : 'bg-discord-brand'
                      } text-white`}>
                        {isCompleted ? <CheckCircle size={16} /> : index + 1}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-discord-header-text">{module.title}</h3>
                        {moduleProgress > 0 && (
                          <div className="mt-1 w-32">
                            <ProgressIndicator 
                              value={moduleProgress} 
                              size="sm" 
                              showText={false} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/courses/${courseSlug}/${module.slug}`}
                      className="flex items-center text-sm text-discord-secondary-text hover:text-discord-header-text"
                    >
                      <span>{moduleProgress > 0 ? 'Continue' : 'Start'}</span>
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </div>
                  {module.discord_thread_url && (
                    <div className="mt-2 ml-11">
                      <a
                        href={module.discord_thread_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-discord-secondary-text hover:text-discord-cta"
                      >
                        <Book size={14} className="mr-1" />
                        <span>Discord Discussion Thread</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;
