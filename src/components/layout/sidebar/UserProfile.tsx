
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ExtendedUser } from '@/types/auth';

interface UserProfileProps {
  isCollapsed: boolean;
  // Optional test props
  testUser?: ExtendedUser;
  testIsAdmin?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  isCollapsed,
  testUser,
  testIsAdmin
}) => {
  // Use the test props if provided, otherwise use the auth context
  const { user: contextUser, isAdmin: contextIsAdmin } = useAuth();
  
  // Use test data if provided, otherwise use context data
  const user = testUser || contextUser;
  const isAdmin = testIsAdmin !== undefined ? testIsAdmin : contextIsAdmin;
  
  // With centralized auth, we rely directly on the is_admin flag
  const hasAdminRole = isAdmin || !!user?.is_admin;
  
  if (!user) return null;
  
  const username = user.discord_username || 'User';
  
  // Format avatar URL if it's just a hash
  let avatarUrl = user.discord_avatar || '';
  if (avatarUrl && user.discord_id && !avatarUrl.startsWith('http')) {
    // It's likely just a hash, format it as a Discord CDN URL
    avatarUrl = `https://cdn.discordapp.com/avatars/${user.discord_id}/${avatarUrl}.png`;
  }
  
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
