-- Drop the existing function
DROP FUNCTION IF EXISTS public.reorder_modules;

-- Recreate the function with fixed admin check to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION public.reorder_modules(course_id uuid, module_ids uuid[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_provider_id text;
  user_id uuid;
  admin_flag boolean;
  admin_ids text[] := ARRAY['404038151565213696', '1040257455592050768', 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'];
  i integer;
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
    RAISE EXCEPTION 'Only admin users can reorder modules';
  END IF;

  -- Update the order_index for each module
  FOR i IN 1..array_length(module_ids, 1) LOOP
    UPDATE public.modules
    SET order_index = i - 1, -- Zero-based indexing
        updated_at = now()
    WHERE id = module_ids[i] AND course_id = reorder_modules.course_id;
  END LOOP;

  RETURN TRUE;
END;
$function$;
