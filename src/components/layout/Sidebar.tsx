
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { useProgress } from '@/context/ProgressContext';
import { courseService, moduleService } from '@/lib/supabase/services';
import { Course, Module } from '@/lib/supabase/types';
import { AdminLink } from './sidebar/AdminLink';
import UserProfile from './sidebar/UserProfile';
import CourseSidebar from './sidebar/CourseSidebar';

const Sidebar: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { isUserAdmin } = useAdmin();
  const { coursesProgress } = useProgress();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [courseModules, setCourseModules] = useState<Record<string, Module[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Fetch all courses, including those the user doesn't have access to
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        setLoading(true);
        
        // Get all courses
        const { data: allCoursesData } = await courseService.getAllCourses();
        if (allCoursesData) {
          console.log('Fetched all courses for sidebar:', allCoursesData);
          setAllCourses(allCoursesData);
          
          // Fetch modules for each course
          const modulePromises = allCoursesData.map(course => 
            moduleService.getModulesByCourseId(course.id)
          );
          
          const moduleResults = await Promise.all(modulePromises);
          
          // Create a map of course ID to modules
          const modulesMap: Record<string, Module[]> = {};
          allCoursesData.forEach((course, index) => {
            if (moduleResults[index].data) {
              modulesMap[course.id] = moduleResults[index].data;
              console.log(`Fetched ${moduleResults[index].data.length} modules for course: ${course.title}`);
            } else {
              console.log(`No modules found for course: ${course.title}`);
              modulesMap[course.id] = [];
            }
          });
          
          setCourseModules(modulesMap);
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
  
  // Admin users have access to all courses
  const hasAdminAccess = isAdmin || isUserAdmin;
  
  if (!isAuthenticated) {
    return null;
  }

  console.log('All Courses:', allCourses);
  console.log('Course Modules:', courseModules);
  console.log('Accessible Course IDs:', accessibleCourseIds);
  console.log('Has admin access:', hasAdminAccess);

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
            {allCourses.length > 0 ? (
              allCourses.map(course => {
                // Admin users have access to all courses
                const hasAccess = hasAdminAccess || accessibleCourseIds.includes(course.id);
                const courseProgress = coursesProgress.find(cp => cp.course.id === course.id);
                const modules = courseModules[course.id] || [];
                
                console.log(`Rendering course "${course.title}" - hasAccess: ${hasAccess}, modules: ${modules.length}`);
                
                return (
                  <CourseSidebar
                    key={course.id}
                    course={course}
                    hasAccess={hasAccess}
                    progress={courseProgress?.completion || 0}
                    modules={modules}
                  />
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-center">
                No courses available
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* User Profile Footer */}
      <UserProfile isCollapsed={false} />
    </aside>
  );
};

export default Sidebar;
