
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { useProgress } from '@/context/ProgressContext';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { courseService } from '@/lib/supabase/services';
import { Course } from '@/lib/supabase/types';
import { AdminLink } from './sidebar/AdminLink';
import UserProfile from './sidebar/UserProfile';
import CourseSidebar from './sidebar/CourseSidebar';

const Sidebar: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { isUserAdmin } = useAdmin();
  const { coursesProgress } = useProgress();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch all courses, including those the user doesn't have access to
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        setLoading(true);
        // Get all courses first
        const { data: allCoursesData } = await courseService.getAllCourses();
        if (allCoursesData) {
          setAllCourses(allCoursesData);
        }
      } catch (error) {
        console.error('Error fetching courses for sidebar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchAllCourses();
    }
  }, [isAuthenticated]);

  // Determine which courses the user has access to
  const accessibleCourseIds = coursesProgress.map(cp => cp.course.id);
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className="flex h-screen flex-col bg-[#2f3136] border-r border-[#1f2225] w-[240px]">
      {/* Portal Header */}
      <div className="p-3 border-b border-[#1f2225] flex items-center justify-center">
        <div className="flex-1 text-white font-bold text-center">
          Lifehacker's Portal
        </div>
      </div>
      
      {/* Admin Link (if admin) */}
      {(isAdmin || isUserAdmin) && <AdminLink isCollapsed={false} />}
      
      {/* Courses Navigation */}
      <div className="flex-1 overflow-y-auto py-2 text-[#b9bbbe]">
        {loading ? (
          <div className="px-4 py-2 text-sm flex items-center justify-center">
            <span className="animate-pulse">Loading courses...</span>
          </div>
        ) : (
          <div className="space-y-1">
            {allCourses.map(course => {
              const hasAccess = accessibleCourseIds.includes(course.id);
              const courseProgress = coursesProgress.find(cp => cp.course.id === course.id);
              
              return (
                <CourseSidebar
                  key={course.id}
                  course={course}
                  hasAccess={hasAccess}
                  progress={courseProgress?.completion || 0}
                />
              );
            })}
          </div>
        )}
      </div>
      
      {/* User Profile Footer */}
      <UserProfile isCollapsed={false} />
    </aside>
  );
};

export default Sidebar;
