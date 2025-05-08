
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { ADMIN_DISCORD_IDS } from '@/types/auth';

interface AdminLinkProps {
  isCollapsed: boolean;
}

export const AdminLink: React.FC<AdminLinkProps> = ({ isCollapsed }) => {
  const { isAdmin, user } = useAuth();
  const { isUserAdmin } = useAdmin();
  
  // Get all possible Discord IDs from user object
  const discordId = user?.discord_id || 
                   user?.user_metadata?.discord_id || 
                   user?.user_metadata?.provider_id || 
                   '';
  
  // Check if the Discord ID is in the admin list
  const isDiscordIdAdmin = ADMIN_DISCORD_IDS.includes(discordId);
  
  // Check if user is admin from ANY source to ensure maximum compatibility
  const hasAdminAccess = isAdmin || 
                        isUserAdmin || 
                        !!user?.is_admin || 
                        !!user?.user_metadata?.is_admin || 
                        isDiscordIdAdmin;
  
  // Enhanced debugging for admin access
  useEffect(() => {
    console.log("Admin Link Debug Info:", { 
      discordId,
      isDiscordIdAdmin,
      isAdmin, 
      isUserAdmin, 
      userIsAdmin: user?.is_admin, 
      userMetadataIsAdmin: user?.user_metadata?.is_admin,
      hasAccess: hasAdminAccess,
      adminIds: ADMIN_DISCORD_IDS,
      fullUserObject: user
    });
  }, [user, isAdmin, isUserAdmin, discordId, isDiscordIdAdmin, hasAdminAccess]);
  
  // Add manual override for development/testing - remove in production
  const forceAdminAccess = false; // Set to true to force admin access for testing
  
  // Only show admin link for admin users
  if (!hasAdminAccess && !forceAdminAccess) {
    return null;
  }
  
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
