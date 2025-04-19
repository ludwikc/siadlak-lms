
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, supabase } from '@/lib/supabase/client';
import { CONTACT_URL } from '@/lib/discord/constants';
import { toast } from 'sonner';

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
        
        // Get Discord provider token from session
        const { provider_token } = session;
        
        if (!provider_token) {
          throw new Error('No Discord access token found');
        }
        
        // Handle Discord-specific auth flow
        const { success, error: discordError } = await auth.handleDiscordAuth(provider_token);
        
        if (!success) {
          throw new Error(discordError || 'Failed to handle Discord authentication');
        }
        
        // Show success message and redirect
        toast.success('Successfully signed in!');
        navigate('/courses');
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
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
          {error.includes('Discord server') && (
            <a
              href={CONTACT_URL}
              className="mb-4 block text-discord-brand hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact for Access
            </a>
          )}
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
