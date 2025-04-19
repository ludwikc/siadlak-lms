
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/lib/supabase/services';
import type { Course } from '@/lib/supabase/types';

const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await courseService.getAccessibleCourses(user.id);
        
        if (error) {
          throw error;
        }
        
        setCourses(data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-discord-header-text">Something went wrong</h2>
          <p className="mb-6 text-discord-secondary-text">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="discord-button-secondary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-8 text-3xl font-bold text-discord-header-text">Your Courses</h1>
      
      {courses.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-discord-sidebar-bg p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-discord-header-text">No courses available</h2>
          <p className="mb-6 text-discord-secondary-text">
            You don't have access to any courses yet. This could be because your Discord roles don't match any course requirements.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link 
              key={course.id} 
              to={`/courses/${course.slug}`}
              className="group overflow-hidden rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg transition-all duration-300 hover:border-discord-brand"
            >
              <div className="aspect-video overflow-hidden">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-discord-sidebar-bg">
                    <span className="text-discord-secondary-text">No thumbnail</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="mb-2 font-semibold text-discord-header-text">{course.title}</h3>
                <p className="line-clamp-2 text-sm text-discord-secondary-text">
                  {course.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
