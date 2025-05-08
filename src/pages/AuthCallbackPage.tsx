
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { CONTACT_URL } from '@/lib/discord/constants';
import { AlertTriangle, Bug } from 'lucide-react';

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
        
        console.log("Auth token received:", authToken.substring(0, 10) + "...");
        
        // Validate token format (basic check)
        if (authToken.length < 20) {
          console.error("Auth token appears to be invalid (too short):", authToken);
          throw new Error("Invalid authentication token received. Please try again.");
        }
        
        console.log("Calling Edge Function to validate token...");
        
        // Call our Edge Function to validate the token and get user data
        const response = await supabase.functions.invoke('validate-auth-token', {
          body: { auth_token: authToken }
        });
        
        console.log("Edge Function response received:", response);
        
        // Improved error handling - check the specific response structure
        if (response.error) {
          console.error("Error invoking validate-auth-token function:", response.error);
          // Store detailed error for debugging
          setDetailedError({
            type: 'edge_function_error',
            error: response.error,
            token_length: authToken.length
          });
          throw new Error(`Failed to validate authentication: ${response.error.message || 'Unknown error'}`);
        }
        
        const data = response.data;
        console.log("Response data structure:", Object.keys(data || {}));
        
        if (!data) {
          console.error("No data received from validate-auth-token");
          setDetailedError({
            type: 'no_data_error',
            response: response
          });
          throw new Error("No data received from authentication service.");
        }
        
        if (!data.success) {
          console.error("Authentication validation failed:", data);
          setDetailedError({
            type: 'validation_failed',
            data: data
          });
          throw new Error(data.error || "Authentication validation failed.");
        }
        
        if (!data.user) {
          console.error("No user data in response:", data);
          setDetailedError({
            type: 'no_user_data',
            data: data
          });
          throw new Error("User data missing from authentication response.");
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
    
    // Create a more readable debug display
    const debugElement = document.createElement('div');
    debugElement.style.position = 'fixed';
    debugElement.style.top = '10%';
    debugElement.style.left = '10%';
    debugElement.style.right = '10%';
    debugElement.style.bottom = '10%';
    debugElement.style.backgroundColor = '#2f3136';
    debugElement.style.color = '#dcddde';
    debugElement.style.padding = '20px';
    debugElement.style.borderRadius = '5px';
    debugElement.style.zIndex = '9999';
    debugElement.style.overflow = 'auto';
    debugElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#4f545c';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(debugElement);
    
    // Add title
    const title = document.createElement('h2');
    title.innerText = 'Authentication Debug Information';
    title.style.marginBottom = '15px';
    title.style.color = 'white';
    
    // Format the error information
    const errorType = document.createElement('h3');
    errorType.innerText = `Error Type: ${detailedError?.type || 'Unknown'}`;
    errorType.style.marginBottom = '10px';
    errorType.style.color = '#ed4245';
    
    const errorContent = document.createElement('pre');
    errorContent.innerText = JSON.stringify(detailedError, null, 2);
    errorContent.style.backgroundColor = '#202225';
    errorContent.style.padding = '15px';
    errorContent.style.borderRadius = '3px';
    errorContent.style.overflow = 'auto';
    errorContent.style.maxHeight = '70%';
    
    // Assemble the debug element
    debugElement.appendChild(closeButton);
    debugElement.appendChild(title);
    debugElement.appendChild(errorType);
    debugElement.appendChild(errorContent);
    
    // Add to the document
    document.body.appendChild(debugElement);
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
                className="flex items-center justify-center gap-2 mt-4 text-sm text-discord-secondary-text hover:text-discord-text w-full"
              >
                <Bug size={16} />
                <span>Show Debug Information</span>
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
