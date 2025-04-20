
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moduleService, courseService } from '@/lib/supabase/services';
import { Module, Course } from '@/lib/supabase/types';
import { ModulesList } from './sidebar/ModulesList';
import { UserProfile } from './sidebar/UserProfile';
import { AdminLink } from './sidebar/AdminLink';

interface CourseSidebarData {
  course: Course;
  modules: Module[];
}

const Sidebar: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { preferences, toggleSidebar, toggleModuleCollapse } = usePreferences();
  const [courseData, setCourseData] = useState<CourseSidebarData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isCollapsed = !preferences.sidebarExpanded;
  const collapsedModules = preferences.collapsedModules || [];
  
  // Fetch course data for sidebar
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const { data: courses } = await courseService.getAccessibleCourses(user?.id || '');
        
        if (courses && courses.length > 0) {
          const course = courses[0];
          const { data: modules } = await moduleService.getModulesByCourseId(course.id);
          
          setCourseData({
            course,
            modules: modules || [],
          });
        }
      } catch (error) {
        console.error('Error fetching course data for sidebar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchCourseData();
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className={cn(
      "flex h-screen flex-col bg-[#2f3136] transition-all duration-300 border-r border-[#1f2225]",
      isCollapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Server/Course Header */}
      <div className="p-3 border-b border-[#1f2225] flex items-center">
        {isCollapsed ? (
          <div className="h-12 w-12 rounded-[50%] bg-[#36393f] flex items-center justify-center text-white font-bold text-lg">
            {courseData?.course?.title?.charAt(0) || 'C'}
          </div>
        ) : (
          <div className="flex-1 text-white font-bold truncate">
            {courseData?.course?.title || 'COURSE'}
            <button 
              onClick={() => toggleSidebar()}
              className="float-right text-gray-400 hover:text-white"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        )}
      </div>
      
      {/* Main Navigation - Modules and Lessons */}
      <div className="flex-1 overflow-y-auto py-2 text-[#b9bbbe]">
        {loading ? (
          <div className="px-4 py-2 text-sm">Loading modules...</div>
        ) : courseData?.modules && courseData.modules.length > 0 ? (
          <>
            {isAdmin && <AdminLink isCollapsed={isCollapsed} />}
            <ModulesList
              course={courseData.course}
              modules={courseData.modules}
              isCollapsed={isCollapsed}
              collapsedModules={collapsedModules}
              toggleModuleCollapse={toggleModuleCollapse}
            />
          </>
        ) : (
          <div className="px-4 py-2 text-sm">No modules available</div>
        )}
      </div>
      
      {/* User Profile Footer */}
      <UserProfile isCollapsed={isCollapsed} />
    </aside>
  );
};

export default Sidebar;
