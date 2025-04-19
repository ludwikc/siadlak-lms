
import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Search, Book } from 'lucide-react';

const TopBar: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  
  // Determine current section based on URL
  const getPageTitle = () => {
    if (location.pathname === '/courses') {
      return 'Dashboard';
    } else if (location.pathname.startsWith('/courses/') && params.courseSlug) {
      if (params.lessonSlug) {
        return params.lessonSlug.replace(/-/g, ' ');
      } else if (params.moduleSlug) {
        return params.moduleSlug.replace(/-/g, ' ');
      } else {
        return params.courseSlug.replace(/-/g, ' ');
      }
    } else if (location.pathname.startsWith('/admin')) {
      return 'Admin Dashboard';
    }
    return 'SIADLAK.COURSES';
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-discord-deep-bg bg-discord-bg px-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-discord-header-text">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="discord-input w-64 pl-10"
          />
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-secondary-text" 
          />
        </div>
        
        {/* If we're in a course, show a link to course overview */}
        {params.courseSlug && !location.pathname.endsWith(`/courses/${params.courseSlug}`) && (
          <Link 
            to={`/courses/${params.courseSlug}`}
            className="flex items-center gap-2 text-discord-secondary-text hover:text-discord-text"
          >
            <Book size={18} />
            <span>Course Overview</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default TopBar;
