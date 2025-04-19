
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, supabase } from '@/lib/supabase/client';
import { CONTACT_URL } from '@/lib/discord/constants';
import { toast } from 'sonner';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        console.log("Auth callback started, getting session...");
        console.log("Current URL:", window.location.href);
        
        // Check for the hash fragment (contains access token) in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          console.log("Found access token in URL hash");
        }
        
        // Get the current session from Supabase
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        console.log("Auth session check result:", data);
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!data.session) {
          // Try to exchange the code for a session
          console.log("No session found, trying to exchange auth code...");
          
          // Get code from URL query parameters
          const query = new URLSearchParams(window.location.search);
          const code = query.get('code');
          
          if (code) {
            console.log("Found auth code in URL, exchanging for session...");
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error("Code exchange error:", exchangeError);
              throw new Error(`Failed to exchange code: ${exchangeError.message}`);
            }
            
            if (!exchangeData.session) {
              throw new Error('No session returned after code exchange.');
            }
            
            console.log("Successfully exchanged code for session");
            
            // Handle Discord-specific auth flow with the session token
            if (!exchangeData.session.provider_token) {
              console.error("No provider token in session after exchange");
              throw new Error("No Discord access token found after authentication. Please try again.");
            }
            
            console.log("Provider token obtained after exchange");
            const { success, error: discordError } = await auth.handleDiscordAuth(
              exchangeData.session.provider_token
            );
            
            if (!success) {
              console.error("Discord auth handling failed:", discordError);
              throw new Error(discordError || 'Failed to handle Discord authentication');
            }
            
            // Show success message and redirect
            toast.success('Successfully signed in!');
            navigate('/courses');
            return;
          } else {
            console.error("No auth code found in URL");
            throw new Error('No authentication code found in URL.');
          }
        }
        
        // We have a session, process the Discord auth
        const { provider_token } = data.session;
        
        if (!provider_token) {
          console.error("No provider token in existing session");
          throw new Error('No Discord access token found. Please try again.');
        }
        
        console.log("Provider token found in existing session");
        
        // Handle Discord-specific auth flow with the session token
        const { success, error: discordError } = await auth.handleDiscordAuth(provider_token);
        
        if (!success) {
          console.error("Discord auth handling failed:", discordError);
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
      } finally {
        setIsProcessing(false);
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
        <h1 className="text-xl font-semibold text-discord-header-text">
          {isProcessing ? 'Processing authentication...' : 'Finishing sign-in...'}
        </h1>
        <p className="mt-2 text-discord-secondary-text">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
