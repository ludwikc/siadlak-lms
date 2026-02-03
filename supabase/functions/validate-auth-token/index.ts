
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to log with timestamps
const logWithTime = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { auth_token } = await req.json();
    
    if (!auth_token) {
      return new Response(
        JSON.stringify({ error: 'auth_token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate token format
    if (typeof auth_token !== 'string') {
      logWithTime('Invalid token format: not a string', typeof auth_token);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid auth_token format', 
          details: { 
            expected: 'string', 
            received: typeof auth_token 
          } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (auth_token.length < 20) {
      logWithTime('Token too short', auth_token.length);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid auth_token: token too short', 
          details: { 
            tokenLength: auth_token.length,
            minLength: 20
          } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for JWT format (basic check)
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const isJwtFormat = jwtRegex.test(auth_token);
    
    logWithTime(`Token format check: ${isJwtFormat ? 'Appears to be JWT' : 'Not standard JWT format'}`);
    
    // We'll proceed even if it's not a standard JWT, but log this for debugging

    logWithTime(`Received auth_token (length: ${auth_token.length}), making request to central auth service`);

    // Make request to the central auth service to validate the token
    // Ensure we're using the correct API endpoint
    const authServiceUrl = 'https://siadlak-auth.lovable.app/api/validate';
    const fallbackUrl = 'https://siadlak-auth.lovable.app/api/user';
    
    logWithTime(`Sending request to primary endpoint: ${authServiceUrl}`);
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Try the primary endpoint first
      let response = await fetch(authServiceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Explicitly request JSON response
        },
        signal: controller.signal
      });
      
      // If the primary endpoint returns a 404, try the fallback endpoint
      if (response.status === 404) {
        logWithTime('Primary endpoint returned 404, trying fallback endpoint');
        
        // Create a new controller for the fallback request
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 10000);
        
        try {
          response = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${auth_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: fallbackController.signal
          });
          
          clearTimeout(fallbackTimeoutId);
          logWithTime('Fallback request completed with status:', response.status);
        } catch (fallbackError) {
          clearTimeout(fallbackTimeoutId);
          throw fallbackError; // This will be caught by the outer catch block
        }
      }
      
      // Clear the timeout
      clearTimeout(timeoutId);

      // Log the response status and headers to help with debugging
      logWithTime('Central auth service response status:', response.status);
      logWithTime('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to validate auth token';
        let errorDetails = {};
        
        // Check Content-Type to determine how to parse the response
        const contentType = response.headers.get('Content-Type') || '';
        logWithTime('Error response content type:', contentType);
        
        if (contentType.includes('application/json')) {
          // Try to get error details if it's JSON
          try {
            errorDetails = await response.json();
            logWithTime('Error response JSON:', errorDetails);
          } catch (e) {
            logWithTime('Error parsing JSON response:', e);
            errorDetails = { parseError: e instanceof Error ? e.message : String(e) };
          }
        } else {
          // If response is not JSON, get text
          try {
            const text = await response.text();
            logWithTime('Error response text (truncated):', text.substring(0, 200));
            errorDetails = { 
              text: text.substring(0, 500),
              contentType: contentType
            };
          } catch (textError) {
            logWithTime('Error getting response text:', textError);
            errorDetails = { error: 'Could not parse response' };
          }
        }
        
        logWithTime('Error validating auth token:', { status: response.status, details: errorDetails });
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            status: response.status,
            details: errorDetails 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check Content-Type header to determine how to handle the response
      const contentType = response.headers.get('Content-Type') || '';
      logWithTime('Success response content type:', contentType);
      
      // Get the validated user data from the central auth service
      let userData;
      if (contentType.includes('application/json')) {
        userData = await response.json();
        logWithTime('User data retrieved from central auth service (JSON format)');
      } else {
        // If not JSON, try to parse the response text as JSON
        const responseText = await response.text();
        logWithTime('Response is not JSON, received text (truncated):', responseText.substring(0, 200));
        try {
          userData = JSON.parse(responseText);
          logWithTime('Successfully parsed text response as JSON');
        } catch (e) {
          logWithTime('Failed to parse response as JSON:', e);
          return new Response(
            JSON.stringify({ 
              error: 'Invalid response format from authentication service',
              details: { 
                contentType: contentType,
                textSample: responseText.substring(0, 500),
                parseError: e instanceof Error ? e.message : String(e)
              }
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Validate the user data structure
      logWithTime('Received user data structure:', Object.keys(userData || {}));
      
      if (!userData) {
        logWithTime('User data is null or undefined');
        return new Response(
          JSON.stringify({ 
            error: 'Empty response from authentication service',
            details: { contentType }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For debugging purposes, let's skip the database operations and just return the user data
      // This will help us determine if the issue is with the database operations or with the auth service
      logWithTime('Skipping database operations for debugging');
      
      // Format Discord avatar URL properly if we have both ID and avatar hash
      const discordId = userData.discord_id || '';
      const discordAvatarHash = userData.discord_avatar || '';
      let formattedAvatarUrl = discordAvatarHash;
      
      if (discordId && discordAvatarHash && !discordAvatarHash.startsWith('http')) {
        // Discord CDN URL format: https://cdn.discordapp.com/avatars/[user_id]/[avatar_hash].png
        formattedAvatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatarHash}.png`;
        logWithTime(`Formatted Discord avatar URL: ${formattedAvatarUrl}`);
      }
      
      // Return the successfully validated user data directly
      return new Response(
        JSON.stringify({ 
          success: true,
          user: {
            ...userData,
            token: auth_token, // Include the token for client-side session
            discord_avatar: formattedAvatarUrl, // Use the formatted URL
            user_metadata: {
              roles: userData.roles || [],
              discord_id: userData.discord_id,
              discord_username: userData.discord_username,
              discord_avatar: formattedAvatarUrl, // Use the formatted URL here too
              is_admin: !!userData.is_admin
            }
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
      /* Temporarily commenting out database operations for debugging
      // Create a client for this app's Supabase project
      const supabaseUrl = 'https://taswmdahpcubiyrgsjki.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY') ?? '';
      
      if (!supabaseKey) {
        logWithTime('SUPABASE_SERVICE_KEY not configured in Edge Function secrets');
        return new Response(
          JSON.stringify({ 
            error: 'Internal server error: Missing service key',
            details: 'The Edge Function is missing required configuration. Please contact the administrator.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
      */

      /* Temporarily commenting out database operations for debugging
      // Extract necessary user details
      const { discord_id, discord_username, discord_avatar, roles, is_admin } = userData;

      if (!discord_id) {
        logWithTime('Invalid user data: Missing discord_id', userData);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid user data received from authentication service',
            details: {
              message: 'The discord_id field is required but was not provided',
              receivedFields: Object.keys(userData)
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      logWithTime(`Processing user: ${discord_username} (${discord_id}), admin: ${is_admin}`);

      // Upsert the user into our local database to maintain app-specific data
      const { data: dbUser, error: upsertError } = await supabase
        .from('users')
        .upsert({
          discord_id,
          discord_username,
          discord_avatar,
          roles: roles || [],
          is_admin: !!is_admin,
          last_login: new Date().toISOString()
        }, { 
          onConflict: 'discord_id',
          returning: 'representation'
        });

      if (upsertError) {
        console.error('Error upserting user data:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store user data', details: upsertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If the upsert didn't return data, manually get the user
      let localUser = dbUser;
      if (!localUser || !Array.isArray(localUser) || localUser.length === 0) {
        const { data: fetchedUser, error: getUserError } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', discord_id)
          .single();

        if (getUserError || !fetchedUser) {
          console.error('Error getting user from database:', getUserError);
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve user data', details: getUserError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        localUser = fetchedUser;
      } else {
        // If it's an array (from returning: 'representation'), get the first element
        localUser = Array.isArray(localUser) ? localUser[0] : localUser;
      }

      console.log('User processed successfully');

      // Store roles in user_roles table if present
      if (roles && Array.isArray(roles) && roles.length > 0) {
        // First, delete existing roles for this user
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', localUser.id);
          
        if (deleteError) {
          console.error('Error deleting existing user roles:', deleteError);
          // Continue despite error
        }
        
        // Then insert new roles
        const rolesToInsert = roles.map(roleId => ({
          user_id: localUser.id,
          discord_role_id: roleId
        }));
        
        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);
          
        if (rolesError) {
          console.error('Error storing user roles:', rolesError);
          // Continue despite error
        }
      }

      // Return the successfully validated and stored user
      logWithTime('Authentication successful, returning user data');
      return new Response(
        JSON.stringify({ 
          success: true,
          user: {
            ...localUser,
            token: auth_token, // Include the token for client-side session
            user_metadata: {
              roles: roles || [],
              discord_id,
              discord_username,
              discord_avatar,
              is_admin: !!is_admin
            }
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      */
    } catch (fetchError) {
      // Handle fetch errors (like timeouts)
      clearTimeout(timeoutId);
      
      logWithTime('Fetch error when calling auth service:', fetchError);
      
      // Check if it's an abort error (timeout)
      const err = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      const isTimeout = err.name === 'AbortError';
      
      return new Response(
        JSON.stringify({ 
          error: isTimeout ? 'Authentication service timed out' : 'Failed to connect to authentication service',
          details: {
            message: err.message,
            isTimeout: isTimeout
          }
        }),
        { status: isTimeout ? 504 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    logWithTime('Unexpected error in validate-auth-token:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: {
          message: err.message,
          stack: err.stack,
          name: err.name
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
