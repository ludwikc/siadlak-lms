
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
        
        // Check for token in different possible parameter names
        const possibleTokenParams = ['auth_token', 'token', 'access_token', 'id_token'];
        let authToken = null;
        
        for (const param of possibleTokenParams) {
          const value = searchParams.get(param);
          if (value) {
            console.log(`Found token in '${param}' parameter`);
            authToken = value;
            break;
          }
        }
        
        // If no token in query params, check for token in hash fragment
        if (!authToken && location.hash) {
          const hashParams = new URLSearchParams(location.hash.substring(1));
          for (const param of possibleTokenParams) {
            const value = hashParams.get(param);
            if (value) {
              console.log(`Found token in hash fragment '${param}' parameter`);
              authToken = value;
              break;
            }
          }
        }
        
        // Check if we received a token
        if (!authToken) {
          console.error("No auth token found in URL parameters or hash fragment");
          setDetailedError({
            type: 'missing_token',
            url: window.location.href,
            search_params: Object.fromEntries(searchParams.entries()),
            hash: location.hash
          });
          throw new Error("Authentication failed. No token received from authentication service.");
        }
        
        console.log("Auth token received:", authToken.substring(0, 10) + "...");
        
        // Validate token format (basic check)
        if (authToken.length < 20) {
          console.error("Auth token appears to be invalid (too short):", authToken);
          throw new Error("Invalid authentication token received. Please try again.");
        }
        
        console.log("Attempting to validate token...");
        
        // Try direct API call to central auth service first
        let userData;
        let success = false;
        
        try {
          console.log("Trying direct API call to central auth service...");
          
          // Try both potential endpoints
          const endpoints = [
            'https://siadlak-auth.lovable.app/api/validate',
            'https://siadlak-auth.lovable.app/api/user'
          ];
          
          let response = null;
          
          // Try each endpoint until one works
          for (const endpoint of endpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              
              // Set a timeout for the fetch request
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              console.log(`Response from ${endpoint}:`, response.status);
              
              if (response.ok) {
                break; // Exit the loop if we get a successful response
              }
            } catch (endpointError) {
              console.error(`Error with endpoint ${endpoint}:`, endpointError);
              // Continue to the next endpoint
            }
          }
          
          if (!response || !response.ok) {
            console.error("All direct API endpoints failed");
            throw new Error("Failed to validate token with central auth service");
          }
          
          // Check content type to determine how to parse the response
          const contentType = response.headers.get('Content-Type') || '';
          console.log("Response content type:", contentType);
          
          if (contentType.includes('application/json')) {
            // Parse as JSON
            const responseData = await response.json();
            console.log("Direct API call successful (JSON):", responseData);
            
            // Extract user data from the response
            userData = responseData;
            success = true;
          } else {
            // Not JSON, try to get the text content for debugging
            const responseText = await response.text();
            console.log("Non-JSON response (first 200 chars):", responseText.substring(0, 200));
            
            // Try to manually extract information from the token
            console.log("Attempting to manually parse the token...");
            
            try {
              // If the token looks like a JWT, try to decode it
              const tokenParts = authToken.split('.');
              if (tokenParts.length === 3) {
                // Decode the payload (middle part)
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log("Decoded token payload:", payload);
                
                // Create a minimal user object from the token payload
                userData = {
                  discord_id: payload.sub || payload.discord_id || '',
                  discord_username: payload.name || payload.discord_username || '',
                  discord_avatar: payload.avatar || payload.discord_avatar || '',
                  roles: payload.roles || [],
                  is_admin: payload.is_admin || false,
                  // Add token metadata
                  user_metadata: {
                    discord_id: payload.sub || payload.discord_id || '',
                    discord_username: payload.name || payload.discord_username || '',
                    discord_avatar: payload.avatar || payload.discord_avatar || '',
                    roles: payload.roles || [],
                    is_admin: payload.is_admin || false
                  }
                };
                
                console.log("Created user data from token:", userData);
                success = true;
              } else {
                throw new Error("Token is not in JWT format");
              }
            } catch (parseError) {
              console.error("Failed to parse token:", parseError);
              setDetailedError({
                type: 'token_parse_error',
                error: parseError.message,
                response_text: responseText.substring(0, 500),
                content_type: contentType
              });
              throw new Error("Failed to parse authentication response");
            }
          }
        } catch (directApiError) {
          console.error("Direct API call failed:", directApiError);
          
          // Fall back to Edge Function
          console.log("Falling back to Edge Function...");
          
          try {
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
                token_length: authToken.length,
                direct_api_error: directApiError.message
              });
              throw new Error(`Failed to validate authentication: ${response.error.message || 'Unknown error'}`);
            }
            
            const data = response.data;
            console.log("Response data structure:", Object.keys(data || {}));
            
            if (!data) {
              console.error("No data received from validate-auth-token");
              setDetailedError({
                type: 'no_data_error',
                response: response,
                direct_api_error: directApiError.message
              });
              throw new Error("No data received from authentication service.");
            }
            
            if (!data.success) {
              console.error("Authentication validation failed:", data);
              setDetailedError({
                type: 'validation_failed',
                data: data,
                direct_api_error: directApiError.message
              });
              throw new Error(data.error || "Authentication validation failed.");
            }
            
            if (!data.user) {
              console.error("No user data in response:", data);
              setDetailedError({
                type: 'no_user_data',
                data: data,
                direct_api_error: directApiError.message
              });
              throw new Error("User data missing from authentication response.");
            }
            
            userData = data.user;
            success = data.success;
          } catch (edgeFunctionError) {
            console.error("Both direct API and Edge Function failed:", edgeFunctionError);
            setDetailedError({
              type: 'all_methods_failed',
              direct_api_error: directApiError.message,
              edge_function_error: edgeFunctionError.message
            });
            throw new Error("All authentication methods failed. Please try again later.");
          }
        }
        
        // Successfully validated user data
        console.log("Authentication successful:", userData);
        
        // Check for discord_id in user or user_metadata
        const discordId = userData.discord_id || userData.user_metadata?.discord_id;
        
        if (!discordId) {
          console.error("Missing discord_id in user data:", userData);
          setDetailedError({
            type: 'missing_discord_id',
            userData: userData
          });
          throw new Error("Invalid user data: Missing Discord ID. Please try again.");
        }
        
        // Get Discord data
        const discordUsername = userData.discord_username || userData.user_metadata?.discord_username || '';
        const discordAvatarHash = userData.discord_avatar || userData.user_metadata?.discord_avatar || '';
        
        // Format Discord avatar URL properly if we have both ID and avatar hash
        let formattedAvatarUrl = '';
        if (discordId && discordAvatarHash) {
          // Discord CDN URL format: https://cdn.discordapp.com/avatars/[user_id]/[avatar_hash].png
          formattedAvatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatarHash}.png`;
        }
        
        // Normalize the user data to ensure it has the expected structure
        const normalizedUserData = {
          discord_id: discordId,
          discord_username: discordUsername,
          discord_avatar: formattedAvatarUrl || discordAvatarHash, // Use formatted URL if available, otherwise use hash
          roles: userData.roles || userData.user_metadata?.roles || [],
          is_admin: userData.is_admin || userData.user_metadata?.is_admin || false,
          // Preserve any other fields from the original user data
          ...userData,
          // Update user_metadata with formatted values
          user_metadata: {
            ...(userData.user_metadata || {}),
            discord_id: discordId,
            discord_username: discordUsername,
            discord_avatar: formattedAvatarUrl || discordAvatarHash,
            roles: userData.roles || userData.user_metadata?.roles || [],
            is_admin: userData.is_admin || userData.user_metadata?.is_admin || false
          }
        };
        
        console.log("Normalized user data:", normalizedUserData);
        
        // Store the authentication data in localStorage
        localStorage.setItem("siadlak_auth_token", authToken);
        localStorage.setItem("siadlak_auth_user", JSON.stringify(normalizedUserData));
        
        toast.success('Successfully signed in!');
        setIsProcessing(false);
        
        // Redirect to courses page
        console.log("Attempting to navigate to /courses...");
        
        // Force a full page reload to ensure AuthContext picks up the new localStorage values
        console.log("Forcing page reload to /courses");
        window.location.href = window.location.origin + '/courses';
        
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
