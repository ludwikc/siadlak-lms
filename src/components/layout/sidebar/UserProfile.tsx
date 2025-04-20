
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
  
  // Check if user is admin based on Discord ID
  const ADMIN_IDS = ['404038151565213696', '1040257455592050768'];
  const providerId = user?.user_metadata?.provider_id;
  const isDiscordAdmin = providerId && ADMIN_IDS.includes(providerId);
  
  // User is admin if either isAdmin from context or has admin Discord ID
  const hasAdminRole = isAdmin || isDiscordAdmin;
  
  if (!user) return null;
  
  const username = user.discord_username || user.user_metadata?.full_name || 'User';
  const avatarUrl = user.discord_avatar || user.user_metadata?.avatar_url;
  
  if (isCollapsed) {
    return (
      <div className="mt-auto p-2">
        <div className="flex justify-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{username[0]}</AvatarFallback>
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
          <AvatarFallback>{username[0]}</AvatarFallback>
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
