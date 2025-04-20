
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminLinkProps {
  isCollapsed: boolean;
}

export const AdminLink: React.FC<AdminLinkProps> = ({ isCollapsed }) => {
  const { isAdmin, user } = useAuth();
  
  // Check if user is admin from context, OR has an admin Discord ID
  const hasAdminAccess = isAdmin || 
    (user?.user_metadata?.provider_id && 
     ['404038151565213696', '1040257455592050768'].includes(user.user_metadata.provider_id as string));
  
  // Only show admin link for admin users
  if (!hasAdminAccess) return null;
  
  if (isCollapsed) {
    return (
      <div className="px-2 py-1">
        <Link
          to="/admin"
          className="flex justify-center p-2 text-[#b9bbbe] hover:text-white rounded hover:bg-[#36393f] transition-colors"
          title="Admin Dashboard"
        >
          <Settings size={20} />
        </Link>
      </div>
    );
  }
  
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
