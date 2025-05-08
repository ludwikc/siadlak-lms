
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserProfileProps {
  isCollapsed: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isCollapsed }) => {
  const { user, isAdmin } = useAuth();
  
  // With centralized auth, we rely directly on the is_admin flag
  const hasAdminRole = isAdmin || !!user?.is_admin;
  
  if (!user) return null;
  
  const username = user.discord_username || 'User';
  const avatarUrl = user.discord_avatar;
  
  if (isCollapsed) {
    return (
      <div className="mt-auto p-2">
        <div className="flex justify-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{username[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-auto p-4">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback>{username[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none text-discord-header-text">{username}</p>
          {hasAdminRole && (
            <Link to="/admin">
              <Badge variant="outline" className="text-xs text-discord-brand hover:bg-discord-sidebar-bg">
                Admin
              </Badge>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
