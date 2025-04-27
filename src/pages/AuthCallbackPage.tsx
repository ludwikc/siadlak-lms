
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { CONTACT_URL } from '@/lib/discord/constants';
import { AlertTriangle } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [detailedError, setDetailedError] = useState<any>(null);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        console.log("Processing auth callback at:", window.location.href);
        
        // Parse the URL query parameters to get the auth_token
        const searchParams = new URLSearchParams(location.search);
        const authToken = searchParams.get('auth_token');
        
        // Check if we received a token
        if (!authToken) {
          console.error("No auth_token found in URL");
          throw new Error("Authentication failed. No token received from authentication service.");
        }
        
        console.log("Auth token received, validating...");
        
        // Call our Edge Function to validate the token and get user data
        const response = await supabase.functions.invoke('validate-auth-token', {
          body: { auth_token: authToken }
        });
        
        // Improved error handling - check the specific response structure
        if (response.error) {
          console.error("Error invoking validate-auth-token function:", response.error);
          // Store detailed error for debugging
          setDetailedError(response.error);
          throw new Error("Failed to validate authentication. Please try again.");
        }
        
        const data = response.data;
        
        if (!data || !data.success || !data.user) {
          console.error("Invalid response from validate-auth-token:", data);
          // Store detailed error for debugging
          setDetailedError(data);
          throw new Error("Invalid response from authentication service.");
        }
        
        // Successfully validated user data
        const userData = data.user;
        console.log("Authentication successful:", userData);
        
        if (!userData || !userData.discord_id) {
          throw new Error("Invalid user data received from authentication service.");
        }
        
        // Store the authentication data in localStorage
        localStorage.setItem("siadlak_auth_token", authToken);
        localStorage.setItem("siadlak_auth_user", JSON.stringify(userData));
        
        toast.success('Successfully signed in!');
        setIsProcessing(false);
        
        // Redirect to courses page
        navigate('/courses', { replace: true });
        
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location, retryCount]);

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error("Maximum retry attempts reached. Please try signing in again.");
      navigate('/', { replace: true });
      return;
    }

    setError(null);
    setIsProcessing(true);
    setRetryCount(prevCount => prevCount + 1);
    
    console.log(`Retrying authentication (${retryCount + 1}/${MAX_RETRIES})...`);
  };

  const showDebugInfo = () => {
    console.log("Detailed error information:", detailedError);
    alert(JSON.stringify(detailedError, null, 2));
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-discord-bg">
        <div className="max-w-md rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-discord-header-text">Authentication Error</h1>
          <p className="mb-6 text-discord-secondary-text">{error}</p>
          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="discord-button-primary block w-full"
              disabled={retryCount >= MAX_RETRIES}
            >
              {retryCount >= MAX_RETRIES ? 'Too Many Attempts' : 'Retry Now'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="discord-button-secondary w-full"
            >
              Back to Login
            </button>
            {detailedError && (
              <button
                onClick={showDebugInfo}
                className="text-sm text-discord-secondary-text hover:text-discord-text"
              >
                Show Debug Info
              </button>
            )}
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-discord-secondary-text hover:text-discord-text"
            >
              Need help? Contact support
            </a>
          </div>
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
        <p className="mt-2 text-discord-secondary-text">
          {retryCount > 0 
            ? `Retrying authentication (${retryCount}/${MAX_RETRIES})...` 
            : 'Please wait while we complete the sign-in process.'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
