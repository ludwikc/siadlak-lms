
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Book, ChevronDown, ChevronRight, Hash, LogOut, Mic, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { moduleService, courseService } from '@/lib/supabase/services';
import { Module, Course } from '@/lib/supabase/types';

interface CourseSidebarData {
  course: Course;
  modules: Module[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, signOut, isAdmin } = useAuth();
  const { preferences, toggleSidebar, toggleModuleCollapse } = usePreferences();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<CourseSidebarData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isCollapsed = !preferences.sidebarExpanded;
  const collapsedModules = preferences.collapsedModules || [];
  
  // Fetch course data for sidebar
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        // For now, just fetch the first course
        const { data: courses } = await courseService.getCourses();
        
        if (courses && courses.length > 0) {
          const course = courses[0];
          const { data: modules } = await moduleService.getModulesByCourse(course.id);
          
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
  }, [isAuthenticated]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/signed-out', { replace: true });
  };
  
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
            {!isCollapsed && (
              <div className="px-4 py-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-2 py-1 flex items-center gap-2 text-sm text-[#b9bbbe] hover:text-white rounded hover:bg-[#36393f] transition-colors"
                  >
                    <Settings size={16} />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
              </div>
            )}
            
            {/* Modules List */}
            <div className="px-1">
              {courseData.modules.map((module) => (
                <Collapsible 
                  key={module.id} 
                  open={!collapsedModules.includes(module.id)}
                  onOpenChange={(open) => toggleModuleCollapse(module.id)}
                  className="mb-2"
                >
                  <CollapsibleTrigger className={cn(
                    "w-full text-left flex items-center px-2 py-1.5 text-xs uppercase tracking-wide font-semibold",
                    isCollapsed ? "justify-center" : "justify-between",
                    "hover:text-white"
                  )}>
                    {!isCollapsed && (
                      <>
                        <span className="truncate">{module.title}</span>
                        {collapsedModules.includes(module.id) ? (
                          <ChevronRight size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </>
                    )}
                    {isCollapsed && <Book size={16} />}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className={cn(
                    isCollapsed && "hidden"
                  )}>
                    <div className="pl-2 pr-1">
                      {/* Would fetch lessons for each module here */}
                      <Link
                        to={`/courses/${courseData.course.slug}/modules/${module.slug}`}
                        className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-[#36393f] text-[#8e9297] hover:text-white group transition-colors"
                      >
                        <Hash size={16} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{`${module.order_index}.1 - first-lesson`}</span>
                      </Link>
                      
                      <Link
                        to={`/courses/${courseData.course.slug}/modules/${module.slug}`}
                        className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-[#36393f] text-[#8e9297] hover:text-white group transition-colors"
                      >
                        <Hash size={16} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{`${module.order_index}.2 - second-lesson`}</span>
                      </Link>
                      
                      <Link
                        to={`/courses/${courseData.course.slug}/modules/${module.slug}`}
                        className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-[#36393f] text-white bg-[#393c43] group transition-colors"
                      >
                        <Mic size={16} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{`${module.order_index}.3 - video-lesson`}</span>
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </>
        ) : (
          <div className="px-4 py-2 text-sm">No modules available</div>
        )}
      </div>
      
      {/* User Profile Footer */}
      <div className="mt-auto bg-[#292b2f] px-2 py-2">
        <div className={cn(
          "flex items-center rounded-md",
          "text-white"
        )}>
          <Avatar className="h-8 w-8 mr-2">
            {user?.discord_avatar ? (
              <AvatarImage 
                src={user.discord_avatar} 
                alt={user.discord_username || 'User avatar'} 
              />
            ) : (
              <AvatarFallback className="bg-[#5865f2]">
                {user?.discord_username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.discord_username || 'User'}
              </p>
              <p className="text-xs text-[#b9bbbe]">
                Online
              </p>
            </div>
          )}
          
          {!isCollapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="ml-1 p-1 rounded-md hover:bg-[#36393f] text-[#b9bbbe] hover:text-white"
                  >
                    <LogOut size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
