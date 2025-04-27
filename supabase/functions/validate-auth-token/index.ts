
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

    // Make request to the central auth service to validate the token
    const authServiceUrl = 'https://siadlak-auth.lovable.app/api/user';
    const response = await fetch(authServiceUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error validating auth token:', response.status, errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to validate auth token',
          status: response.status,
          details: errorData 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the validated user data from the central auth service
    const userData = await response.json();
    console.log('User data retrieved from central auth service:', JSON.stringify(userData));

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

    // Store or update the user in our database
    const { discord_id, discord_username, discord_avatar, roles, is_admin } = userData;

    // Upsert the user into our local database to maintain app-specific data
    const { data: dbUser, error: upsertError } = await supabase
      .from('users')
      .upsert({
        discord_id,
        discord_username,
        discord_avatar,
        roles,
        is_admin,
        last_login: new Date().toISOString()
      }, { 
        onConflict: 'discord_id',
        returning: 'minimal'
      });

    if (upsertError) {
      console.error('Error upserting user data:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store user data', details: upsertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from our database to return complete user data including ID
    const { data: localUser, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discord_id)
      .single();

    if (getUserError || !localUser) {
      console.error('Error getting user from database:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve user data', details: getUserError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store roles in user_roles table if present
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // First, delete existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', localUser.id);
      
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
      }
    }

    // Return the successfully validated and stored user
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          ...localUser,
          token: auth_token // Include the token for client-side session
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
