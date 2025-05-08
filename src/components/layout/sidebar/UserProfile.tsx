
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
  
  // Get username with fallback
  const username = user.discord_username || user.user_metadata?.discord_username || 'User';
  
  // Get avatar URL with fallback
  let avatarUrl = user.discord_avatar || user.user_metadata?.discord_avatar || '';
  
  // If the avatar URL is just a hash and not a full URL, format it properly
  if (avatarUrl && !avatarUrl.startsWith('http') && user.discord_id) {
    avatarUrl = `https://cdn.discordapp.com/avatars/${user.discord_id}/${avatarUrl}.png`;
  }
  
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
