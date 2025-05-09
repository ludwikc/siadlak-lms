-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_module;

-- Recreate the function with fixed admin check to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION public.create_module(
  module_title text,
  module_slug text,
  module_course_id uuid,
  module_order_index integer DEFAULT 0,
  module_discord_thread_url text DEFAULT NULL::text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_id uuid;
  user_provider_id text;
  user_id uuid;
  admin_flag boolean;
  admin_ids text[] := ARRAY['404038151565213696', '1040257455592050768', 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'];
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Get the provider_id from user metadata
  SELECT auth.jwt() ->> 'provider_id' INTO user_provider_id;
  
  -- Check if is_admin flag is set in user metadata - using a different variable name to avoid ambiguity
  SELECT (auth.jwt() ->> 'is_admin')::boolean INTO admin_flag;
  
  -- Enhanced admin check - either provider_id is in admin list OR user_id is in admin list OR is_admin flag is true
  IF (user_provider_id IS NULL OR NOT (user_provider_id = ANY(admin_ids))) AND 
     (user_id IS NULL OR NOT (user_id::text = ANY(admin_ids))) AND
     (admin_flag IS NULL OR NOT admin_flag) THEN
    RAISE EXCEPTION 'Only admin users can create modules';
  END IF;

  -- Insert the new module
  INSERT INTO public.modules (
    title,
    slug,
    course_id,
    order_index,
    discord_thread_url
  ) VALUES (
    module_title,
    module_slug,
    module_course_id,
    module_order_index,
    module_discord_thread_url
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;
