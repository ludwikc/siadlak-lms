
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Book, Home, Settings, LogOut } from 'lucide-react';
import { ExtendedUser } from '@/types/auth';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="flex w-64 flex-col bg-discord-sidebar-bg">
      {/* Logo/Header */}
      <div className="discord-sidebar-header">
        <h1 className="text-lg font-bold text-discord-header-text">
          SIADLAK.COURSES
        </h1>
      </div>
      
      {/* User Profile */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-discord-deep-bg">
        {user?.discord_avatar ? (
          <img 
            src={user.discord_avatar} 
            alt={user.discord_username || 'User'} 
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-discord-brand text-white">
            {user?.discord_username ? user.discord_username.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <div>
          <p className="font-medium text-discord-text">{user?.discord_username || 'User'}</p>
          <p className="text-sm text-discord-secondary-text">
            {user?.is_admin ? 'Admin' : 'Student'}
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          <li>
            <Link
              to="/courses"
              className={`discord-channel ${isActive('/courses') ? 'active' : ''}`}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <div className="px-2 py-2 text-xs font-semibold uppercase text-discord-secondary-text">
              Your Courses
            </div>
            {/* This will be populated dynamically with courses */}
            <div className="py-1 text-sm text-discord-secondary-text px-4">
              No courses available yet
            </div>
          </li>
          {user?.is_admin && (
            <li>
              <Link
                to="/admin"
                className={`discord-channel ${isActive('/admin') ? 'active' : ''}`}
              >
                <Settings size={20} />
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="border-t border-discord-deep-bg p-4">
        <button
          onClick={() => signOut()}
          className="discord-channel w-full justify-start"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
