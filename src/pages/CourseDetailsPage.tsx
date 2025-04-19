
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, moduleService } from '@/lib/supabase/services';
import type { Course, Module } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { Book, ChevronRight } from 'lucide-react';

const CourseDetailsPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
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
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseSlug, user]);

  const navigateToFirstLesson = () => {
    if (modules.length > 0) {
      navigate(`/courses/${courseSlug}/${modules[0].slug}`);
    }
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
        </div>
        <button
          onClick={navigateToFirstLesson}
          className="discord-button-primary mt-4 md:mt-0"
          disabled={modules.length === 0}
        >
          Start Learning
        </button>
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
            {modules.map((module, index) => (
              <div key={module.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-discord-brand text-white">
                      {index + 1}
                    </div>
                    <h3 className="ml-3 font-medium text-discord-header-text">{module.title}</h3>
                  </div>
                  <Link
                    to={`/courses/${courseSlug}/${module.slug}`}
                    className="flex items-center text-sm text-discord-secondary-text hover:text-discord-header-text"
                  >
                    <span>View Module</span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;
