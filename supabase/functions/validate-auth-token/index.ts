
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    console.log('Received auth_token, making request to central auth service');

    // Make request to the central auth service to validate the token
    const authServiceUrl = 'https://siadlak-auth.lovable.app/api/user';
    const response = await fetch(authServiceUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`,
        'Content-Type': 'application/json'
      }
    });

    // Log the response status to help with debugging
    console.log('Central auth service response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Failed to validate auth token';
      let errorDetails = {};
      
      // Try to get error details if available
      try {
        errorDetails = await response.json();
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          errorDetails = { text: text.substring(0, 500) }; // Limit text size
        } catch (textError) {
          errorDetails = { error: 'Could not parse response' };
        }
      }
      
      console.error('Error validating auth token:', response.status, errorDetails);
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: response.status,
          details: errorDetails 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the validated user data from the central auth service
    const userData = await response.json();
    console.log('User data retrieved from central auth service');

    // Create a client for this app's Supabase project
    const supabaseUrl = 'https://taswmdahpcubiyrgsjki.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY') ?? '';
    
    if (!supabaseKey) {
      console.error('SUPABASE_SERVICE_KEY not configured in Edge Function secrets');
      return new Response(
        JSON.stringify({ error: 'Internal server error: Missing service key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    // Extract necessary user details
    const { discord_id, discord_username, discord_avatar, roles, is_admin } = userData;

    if (!discord_id) {
      console.error('Invalid user data: Missing discord_id');
      return new Response(
        JSON.stringify({ error: 'Invalid user data received from authentication service' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing user: ${discord_username} (${discord_id}), admin: ${is_admin}`);

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
        returning: 'representation'  // Changed from 'minimal' to get the data back
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

  } catch (error) {
    console.error('Unexpected error in validate-auth-token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
