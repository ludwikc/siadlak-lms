
-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_course;

-- Recreate the function with enhanced admin check
CREATE OR REPLACE FUNCTION public.create_course(course_title text, course_slug text, course_description text DEFAULT NULL::text, course_thumbnail_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_id uuid;
  user_provider_id text;
  user_id uuid;
  is_admin boolean;
  admin_ids text[] := ARRAY['404038151565213696', '1040257455592050768', 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'];
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Get the provider_id from user metadata
  SELECT auth.jwt() ->> 'provider_id' INTO user_provider_id;
  
  -- Check if is_admin flag is set in user metadata
  SELECT (auth.jwt() ->> 'is_admin')::boolean INTO is_admin;
  
  -- Enhanced admin check - either provider_id is in admin list OR user_id is in admin list OR is_admin flag is true
  IF (user_provider_id IS NULL OR NOT (user_provider_id = ANY(admin_ids))) AND 
     (user_id IS NULL OR NOT (user_id::text = ANY(admin_ids))) AND
     (is_admin IS NULL OR NOT is_admin) THEN
    RAISE EXCEPTION 'Only admin users can create courses';
  END IF;

  -- Insert the new course
  INSERT INTO public.courses (
    title,
    slug,
    description,
    thumbnail_url
  ) VALUES (
    course_title,
    course_slug,
    course_description,
    course_thumbnail_url
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;
