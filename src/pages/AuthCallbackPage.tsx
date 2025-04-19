
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

        // First, check for authorization code in query parameters
        const query = new URLSearchParams(window.location.search);
        const code = query.get('code');
        const errorParam = query.get('error');
        const errorDescription = query.get('error_description');
        
        // If Discord returned an error, handle it
        if (errorParam) {
          console.error("Discord returned an error:", errorParam, errorDescription);
          throw new Error(`Discord authentication error: ${errorDescription || errorParam}`);
        }
        
        if (!code) {
          console.error("No authorization code found in URL");
          
          // Check if we have a hash fragment that might contain the code (some OAuth flows use this)
          if (location.hash) {
            const hashParams = new URLSearchParams(location.hash.substring(1));
            const hashCode = hashParams.get('code');
            
            if (hashCode) {
              console.log("Found code in hash fragment, proceeding with that");
              await processAuthCode(hashCode);
              return;
            }
          }
          
          // If we're on the callback page but no code is present, redirect back to login
          toast.error('Authentication failed. No authorization code found. Please try signing in again.');
          navigate('/');
          return;
        }
        
        await processAuthCode(code);
        
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    const processAuthCode = async (code: string) => {
      console.log("Auth code found, exchanging for session...");
      
      try {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Code exchange error:", exchangeError);
          throw new Error(`Discord authentication error: ${exchangeError.message}`);
        }
        
        if (!exchangeData.session) {
          throw new Error('No session returned after code exchange.');
        }
        
        const token = exchangeData.session.provider_token;
        if (!token) {
          throw new Error(
            'No Discord access token found. This could be due to an incorrectly configured Discord provider in Supabase. ' +
            'Please check your Supabase Discord OAuth settings and ensure they match your Discord application.'
          );
        }
        
        console.log("Successfully exchanged code for session, got provider_token");
        
        const { success, error: discordError } = await auth.handleDiscordAuth(token);
        if (!success) {
          throw new Error(discordError || 'Failed to handle Discord authentication');
        }

        toast.success('Successfully signed in!');
        navigate('/courses');
      } catch (error) {
        console.error("Session exchange error:", error);
        throw error;
      }
    };

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
