
-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_course;

-- Recreate the function with provider_id check
CREATE OR REPLACE FUNCTION public.create_course(course_title text, course_slug text, course_description text DEFAULT NULL::text, course_thumbnail_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_id uuid;
  user_provider_id text;
  admin_ids text[] := ARRAY['404038151565213696', '1040257455592050768'];
BEGIN
  -- Get the provider_id from user metadata
  SELECT auth.jwt() ->> 'provider_id' INTO user_provider_id;
  
  -- Check if the provider_id is in the admin list
  IF user_provider_id IS NULL OR NOT (user_provider_id = ANY(admin_ids)) THEN
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
