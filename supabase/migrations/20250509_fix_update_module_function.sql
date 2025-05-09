-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_module;

-- Recreate the function with fixed admin check to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION public.update_module(
  module_id uuid,
  module_title text DEFAULT NULL,
  module_slug text DEFAULT NULL,
  module_course_id uuid DEFAULT NULL,
  module_order_index integer DEFAULT NULL,
  module_discord_thread_url text DEFAULT NULL
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
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
    RAISE EXCEPTION 'Only admin users can update modules';
  END IF;

  -- Update the module with non-null values
  UPDATE public.modules
  SET
    title = COALESCE(module_title, title),
    slug = COALESCE(module_slug, slug),
    course_id = COALESCE(module_course_id, course_id),
    order_index = COALESCE(module_order_index, order_index),
    discord_thread_url = COALESCE(module_discord_thread_url, discord_thread_url),
    updated_at = now()
  WHERE id = module_id;

  RETURN FOUND;
END;
$function$;
