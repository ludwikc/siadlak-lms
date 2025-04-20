
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Book, Home, Settings, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ContinueLearningButton from '@/components/progress/ContinueLearningButton';
import ProgressIndicator from '@/components/progress/ProgressIndicator';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { coursesProgress, lastVisited } = useProgress();
  const { preferences, toggleSidebar } = usePreferences();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/signed-out', { replace: true });
  };
  
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isCollapsed = !preferences.sidebarExpanded;

  // Find in-progress courses
  const inProgressCourses = coursesProgress
    .filter(cp => cp.completion > 0 && cp.completion < 100)
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 3); // Limit to top 3

  return (
    <aside className={cn(
      "flex h-screen flex-col bg-discord-sidebar-bg transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Header */}
      <div className="discord-sidebar-header flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-lg font-bold text-discord-header-text">
            SIADLAK.COURSES
          </h1>
        )}
        {isCollapsed && (
          <span className="mx-auto text-xl font-bold text-discord-header-text">
            S
          </span>
        )}
        
        {/* Toggle button */}
        <button 
          onClick={() => toggleSidebar()}
          className="text-discord-secondary-text hover:text-discord-text p-1 rounded-full"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          <li>
            <Link
              to="/courses"
              className={`discord-channel ${isActive('/courses') ? 'active' : ''} ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Home size={20} />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </li>
          
          {/* Continue Learning Button */}
          {!isCollapsed && lastVisited && (
            <li className="pt-2">
              <ContinueLearningButton className="w-full justify-center" />
            </li>
          )}
          
          {/* In Progress Courses */}
          {!isCollapsed && inProgressCourses.length > 0 && (
            <li className="pt-4">
              <div className="px-2 py-2 text-xs font-semibold uppercase text-discord-secondary-text">
                In Progress
              </div>
              {inProgressCourses.map(({ course, completion }) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className="discord-channel"
                >
                  <Book size={18} />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate">{course.title}</div>
                    <ProgressIndicator 
                      value={completion} 
                      size="sm" 
                      showText={false} 
                      className="mt-1" 
                    />
                  </div>
                </Link>
              ))}
            </li>
          )}
          
          {/* Admin Section */}
          {user?.is_admin && (
            <li>
              <Link
                to="/admin"
                className={`discord-channel ${isActive('/admin') ? 'active' : ''} ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Settings size={20} />
                {!isCollapsed && <span>Admin</span>}
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      {/* User Profile Footer */}
      <div className="mt-auto border-t border-discord-deep-bg">
        <div className="p-2">
          <div className={cn(
            "flex items-center gap-2 rounded-md p-2 text-discord-text hover:bg-discord-deep-bg transition-colors",
            isCollapsed ? "justify-center" : "justify-start"
          )}>
            <Avatar className="h-8 w-8">
              {user?.discord_avatar ? (
                <AvatarImage 
                  src={user.discord_avatar} 
                  alt={user.discord_username || 'User avatar'} 
                />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
            
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user?.discord_username || 'User'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="mt-1 flex items-center gap-1 text-xs text-discord-secondary-text hover:text-discord-text"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
