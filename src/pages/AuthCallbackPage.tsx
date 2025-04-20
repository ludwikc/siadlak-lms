
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { discordApi } from '@/lib/discord/api';
import { GUILD_ID, CONTACT_URL } from '@/lib/discord/constants';
import { userService } from '@/lib/supabase/services/user.service';
import { Link } from 'react-router-dom';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        console.log("Processing auth callback");
        
        // Check if there's an error in the URL
        const url = new URL(window.location.href);
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (errorParam) {
          throw new Error(`Discord authentication error: ${errorDescription || errorParam}`);
        }

        // First, get the session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Authentication error: ${sessionError.message}`);
        }
        
        const session = sessionData?.session;
        if (!session) {
          throw new Error("No session found. Please try signing in again.");
        }

        // Get the Discord access token from the session
        const { provider_token: discordToken } = session;
        
        if (!discordToken) {
          throw new Error("Discord access token not found. Please try signing in again.");
        }
        
        console.log("Session obtained, checking guild membership");
        
        // Check if the user is a member of our Discord guild
        const guildMember = await discordApi.checkGuildMembership(discordToken);
        
        if (!guildMember) {
          throw new Error(
            `You need to be a member of our Discord server to access this application. ` +
            `Please join our server and try again. Contact us at ${CONTACT_URL} for assistance.`
          );
        }
        
        // Extract user info from the Discord response
        const { user } = session;
        const discordUserId = user.user_metadata.provider_id;
        const discordUsername = user.user_metadata.full_name;
        const discordAvatar = user.user_metadata.avatar_url;
        
        // Extract roles from the guild member object
        const discordRoles = guildMember.roles || [];
        
        console.log("User is guild member with roles:", discordRoles);
        
        // Save/update the user in our database
        await userService.upsertUser({
          discord_id: discordUserId,
          discord_username: discordUsername,
          discord_avatar: discordAvatar,
          is_admin: isAdminUser(discordUserId)
        });
        
        // Save/update user roles
        await userService.upsertUserRoles(user.id, discordRoles);
        
        console.log("User data saved, authentication successful");
        toast.success('Successfully signed in!');
        
        // Refresh the auth context to include the updated user data
        await refreshSession();
        
        setIsProcessing(false);
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, refreshSession]);

  // Check if user is an admin by Discord ID
  const isAdminUser = (discordId: string): boolean => {
    const ADMIN_DISCORD_IDS = ['404038151565213696', '1040257455592050768'];
    return ADMIN_DISCORD_IDS.includes(discordId);
  };

  // Redirect after auth processing is complete
  useEffect(() => {
    if (!isProcessing && !error) {
      navigate('/courses', { replace: true });
    }
  }, [isProcessing, navigate, error]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-discord-bg">
        <div className="max-w-md rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-discord-header-text">Authentication Error</h1>
          <p className="mb-6 text-discord-secondary-text">{error}</p>
          {error.includes('member of our Discord server') ? (
            <div className="space-y-4">
              <a
                href={`https://discord.gg/invite/${GUILD_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="discord-button-primary block w-full"
              >
                Join Discord Server
              </a>
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="discord-button-secondary block w-full"
              >
                Contact Support
              </a>
            </div>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="discord-button-secondary w-full"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-discord-bg">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent mx-auto"></div>
        <h1 className="text-xl font-semibold text-discord-header-text">
          {isProcessing ? 'Processing authentication...' : 'Finishing sign-in...'}
        </h1>
        <p className="mt-2 text-discord-secondary-text">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
