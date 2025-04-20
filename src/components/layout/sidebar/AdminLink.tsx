
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface AdminLinkProps {
  isCollapsed: boolean;
}

export const AdminLink: React.FC<AdminLinkProps> = ({ isCollapsed }) => {
  if (isCollapsed) return null;
  
  return (
    <div className="px-4 py-1">
      <Link
        to="/admin"
        className="px-2 py-1 flex items-center gap-2 text-sm text-[#b9bbbe] hover:text-white rounded hover:bg-[#36393f] transition-colors"
      >
        <Settings size={16} />
        <span>Admin Dashboard</span>
      </Link>
    </div>
  );
};
