
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/lib/supabase/services';
import type { Course } from '@/lib/supabase/types';
import { Edit, Trash, Plus } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllCourses = async () => {
      if (!user?.is_admin) return;
      
      try {
        setIsLoading(true);
        
        // This is a simplified approach - in a real app, we'd need an admin-specific endpoint
        // For now, we're just simulating by fetching all courses the admin has access to
        const { data: userCourses, error } = await courseService.getAccessibleCourses(user.id);
        
        if (error) {
          throw error;
        }
        
        setCourses(userCourses || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCourses();
  }, [user]);

  if (!user?.is_admin) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-discord-header-text">Access Denied</h2>
          <p className="mb-6 text-discord-secondary-text">
            You don't have permission to access the admin dashboard.
          </p>
          <Link to="/courses" className="discord-button-secondary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-discord-header-text">Admin Dashboard</h1>
        <Link to="/admin/courses/new" className="discord-button-primary flex items-center gap-2">
          <Plus size={18} />
          <span>New Course</span>
        </Link>
      </div>
      
      {/* Courses Management */}
      <div className="mb-8 rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg overflow-hidden">
        <div className="border-b border-discord-sidebar-bg p-4">
          <h2 className="text-xl font-semibold text-discord-header-text">Manage Courses</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-discord-sidebar-bg text-left text-sm font-medium text-discord-header-text">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Title</th>
                <th className="whitespace-nowrap px-4 py-3">Slug</th>
                <th className="whitespace-nowrap px-4 py-3">Created</th>
                <th className="whitespace-nowrap px-4 py-3">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-discord-sidebar-bg">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-discord-secondary-text">
                    No courses available. Create your first course!
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-discord-sidebar-bg/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-discord-header-text">
                      {course.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-discord-secondary-text">
                      {course.slug}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-discord-secondary-text">
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-discord-secondary-text">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/courses/${course.id}`}
                          className="rounded-md bg-discord-secondary p-2 text-white hover:bg-opacity-90"
                          aria-label="Edit course"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          className="rounded-md bg-discord-brand p-2 text-white hover:bg-opacity-90"
                          aria-label="Delete course"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Discord Role Management - Placeholder */}
      <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
        <div className="border-b border-discord-sidebar-bg p-4">
          <h2 className="text-xl font-semibold text-discord-header-text">Discord Role Mapping</h2>
        </div>
        <div className="p-6">
          <p className="text-discord-secondary-text">
            This section will allow administrators to map Discord roles to courses, controlling which
            users can access specific content based on their Discord server roles.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              className="discord-button-secondary"
              disabled
            >
              Manage Role Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
