import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_API_URL = "https://discord.com/api/v10";
const GUILD_ID = "428530875085619200";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is authenticated and is admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_admin) {
      console.log("User is not admin:", user.id);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { discordUserId } = await req.json();
    if (!discordUserId) {
      return new Response(JSON.stringify({ error: "discordUserId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Discord bot token from secrets
    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) {
      console.error("DISCORD_BOT_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Discord bot token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching Discord member ${discordUserId} from guild ${GUILD_ID}`);

    // Fetch guild member using bot token
    const memberResponse = await fetch(
      `${DISCORD_API_URL}/guilds/${GUILD_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!memberResponse.ok) {
      const status = memberResponse.status;
      console.error(`Discord API error: ${status}`);

      if (status === 404) {
        return new Response(JSON.stringify({ error: "User not found in guild", notFound: true }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === 429) {
        const retryAfter = memberResponse.headers.get("Retry-After") || "60";
        return new Response(
          JSON.stringify({ error: `Rate limited. Retry after ${retryAfter} seconds.` }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: `Discord API error: ${status}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const member = await memberResponse.json();
    console.log(`Found member with ${member.roles?.length || 0} roles`);

    // Return member data
    return new Response(
      JSON.stringify({
        user: member.user,
        roles: member.roles || [],
        nick: member.nick,
        joined_at: member.joined_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in fetch-discord-member:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
