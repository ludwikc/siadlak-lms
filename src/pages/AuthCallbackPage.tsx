
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, supabase } from '@/lib/supabase/client';
import { CONTACT_URL, DEBUG_AUTH } from '@/lib/discord/constants';
import { toast } from 'sonner';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Log the full URL and search params for debugging
        if (DEBUG_AUTH) {
          console.log("Auth callback URL:", window.location.href);
          console.log("Search params:", location.search);
          console.log("Hash params:", location.hash);
        }

        // Get the session directly since Supabase should handle the code exchange
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(`Authentication error: ${sessionError.message}`);
        }
        
        if (!data.session) {
          // If no session, check if there's an error in the URL
          const query = new URLSearchParams(window.location.search);
          const errorParam = query.get('error');
          const errorDescription = query.get('error_description');
          
          if (errorParam) {
            throw new Error(`Discord authentication error: ${errorDescription || errorParam}`);
          }
          
          // No session and no error usually means the code exchange failed
          throw new Error("Authentication failed. No session found. The code exchange may have failed.");
        }
        
        // If we have a session, we need to handle the Discord auth
        const token = data.session.provider_token;
        if (!token) {
          throw new Error(
            'No Discord access token found. This could be due to an incorrectly configured Discord provider in Supabase. ' +
            'Please check your Supabase Discord OAuth settings.'
          );
        }
        
        // Process Discord auth with the token
        const { success, error: discordError } = await auth.handleDiscordAuth(token);
        if (!success) {
          throw new Error(discordError || 'Failed to handle Discord authentication');
        }

        toast.success('Successfully signed in!');
        // Always redirect to courses after successful login
        navigate('/courses', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    // Execute auth callback handling
    handleAuthCallback();
  }, [navigate, location]);

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
        <h1 className="text-xl font-semibold text-discord-header-text">
          {isProcessing ? 'Processing authentication...' : 'Finishing sign-in...'}
        </h1>
        <p className="mt-2 text-discord-secondary-text">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
