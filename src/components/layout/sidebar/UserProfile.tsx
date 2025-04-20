
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  isCollapsed: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signed-out', { replace: true });
  };

  return (
    <div className="mt-auto bg-[#292b2f] px-2 py-2">
      <div className={cn(
        "flex items-center rounded-md",
        "text-white"
      )}>
        <Avatar className="h-8 w-8 mr-2">
          {user?.discord_avatar ? (
            <AvatarImage 
              src={user.discord_avatar} 
              alt={user.discord_username || 'User avatar'} 
            />
          ) : (
            <AvatarFallback className="bg-[#5865f2]">
              {user?.discord_username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          )}
        </Avatar>
        
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.discord_username || 'User'}
            </p>
            <p className="text-xs text-[#b9bbbe]">
              {user?.is_admin ? 'Admin' : 'Online'}
            </p>
          </div>
        )}
        
        {!isCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="ml-1 p-1 rounded-md hover:bg-[#36393f] text-[#b9bbbe] hover:text-white"
                >
                  <LogOut size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Sign out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
