
import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/supabase/services/auth.service';
import { FailedLogin } from '@/lib/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MessageSquare, RefreshCw, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const FailedLoginsList: React.FC = () => {
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFailedLogins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await authService.getRecentFailedLogins(20);
      
      if (error) {
        throw error;
      }
      
      setFailedLogins(data || []);
    } catch (err) {
      console.error('Error fetching failed logins:', err);
      setError('Failed to load unauthorized login attempts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedLogins();
  }, []);

  const sendDiscordMessage = async (discordId: string, username: string) => {
    try {
      toast.info(`Preparing to send message to ${username || discordId}...`);
      // This would connect to a Discord bot through an edge function
      // For now, we'll just show a toast notification
      
      setTimeout(() => {
        toast.success(`A message would be sent to user ${username || discordId} via Discord Bot`);
      }, 1500);
      
      // In a real implementation, you would:
      // 1. Call an edge function that triggers your Discord bot
      // 2. The bot would send a DM to the user
      // 3. Update the UI based on the result
    } catch (error) {
      console.error('Error sending Discord message:', error);
      toast.error('Failed to send Discord message. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-discord-header-text">
            <UserX className="h-5 w-5 text-red-500" />
            Unauthorized Login Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-discord-brand border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-discord-header-text">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="mb-4 text-discord-secondary-text">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchFailedLogins}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-discord-header-text">
          <UserX className="h-5 w-5 text-red-500" />
          Unauthorized Login Attempts
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchFailedLogins}
          className="h-8 gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {failedLogins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-discord-sidebar-bg p-3">
              <UserX className="h-6 w-6 text-discord-secondary-text" />
            </div>
            <p className="text-discord-secondary-text">No unauthorized login attempts recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {failedLogins.map((login) => (
              <div key={login.id} className="flex items-start gap-3 rounded-md border border-discord-sidebar-bg p-3">
                <Avatar className="h-10 w-10 border border-discord-sidebar-bg">
                  <AvatarImage src={login.discord_avatar || undefined} alt={login.discord_username || 'User'} />
                  <AvatarFallback className="bg-discord-sidebar-bg text-discord-text">
                    {login.discord_username ? login.discord_username.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-discord-header-text">
                        {login.discord_username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-discord-secondary-text">ID: {login.discord_id}</p>
                    </div>
                    <p className="text-xs text-discord-secondary-text">
                      {login.created_at ? formatDistanceToNow(new Date(login.created_at), { addSuffix: true }) : 'Unknown time'}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-discord-secondary-text">
                    {login.reason === 'not_guild_member' 
                      ? 'Not a member of Discord server' 
                      : login.reason}
                  </p>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => sendDiscordMessage(login.discord_id, login.discord_username || '')}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Send Discord Message
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FailedLoginsList;
