
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, supabase } from '@/lib/supabase/client';
import { userService } from '@/lib/supabase/services';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get session and check auth state
        const { data: { session } } = await auth.getSession();
        
        if (!session) {
          throw new Error('Authentication failed');
        }
        
        // Get Discord user info from session
        const { user: authUser } = session;
        const identities = authUser?.identities || [];
        const discordIdentity = identities.find(
          (identity) => identity.provider === 'discord'
        );
        
        if (!discordIdentity) {
          throw new Error('No Discord identity found');
        }
        
        // Get Discord profile info from session
        const discordId = discordIdentity.id;
        const discordUsername = authUser?.user_metadata?.full_name || 'Discord User';
        const discordAvatar = authUser?.user_metadata?.avatar_url || '';
        
        // Create or update user in our database
        await userService.upsertUser({
          discord_id: discordId,
          discord_username: discordUsername,
          discord_avatar: discordAvatar,
          is_admin: false, // Default value - would be updated manually for admins
          settings: {},
          last_login: new Date().toISOString()
        });
        
        // Once we have Discord auth, we would fetch the user's roles from Discord API
        // and store them in our database. This would typically be done in a Supabase function.
        // For now, this is a placeholder for that logic.
        
        // Redirect to courses page
        navigate('/courses');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-discord-bg">
        <div className="max-w-md rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-discord-header-text">Authentication Error</h1>
          <p className="mb-6 text-discord-secondary-text">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="discord-button-secondary"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-discord-bg">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent mx-auto"></div>
        <h1 className="text-xl font-semibold text-discord-header-text">Finishing authentication...</h1>
        <p className="mt-2 text-discord-secondary-text">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
