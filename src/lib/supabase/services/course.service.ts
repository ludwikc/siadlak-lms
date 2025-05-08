
import { supabase } from '../client';
import type { Course } from '../types';
import { ADMIN_DISCORD_IDS, ExtendedUser } from '@/types/auth';

export const courseService = {
  // Check if user is admin
  isUserAdmin: async () => {
    // Get the current user with their metadata to check for admin status
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Cast user to ExtendedUser type for TypeScript
    const extendedUser = user as ExtendedUser;
    
    // Enhanced admin check
    const discordId = extendedUser.discord_id || 
                    extendedUser.user_metadata?.discord_id || 
                    extendedUser.user_metadata?.provider_id || 
                    '';
    
    return !!extendedUser.is_admin || 
           !!extendedUser.user_metadata?.is_admin ||
           (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
           (extendedUser.id && ADMIN_DISCORD_IDS.includes(extendedUser.id));
  },

  // Get all courses - needed for admin functions
  getAllCourses: async () => {
    // Check admin status first
    const isAdmin = await courseService.isUserAdmin();
    if (!isAdmin) {
      return { 
        data: [], 
        error: new Error('Only admin users can retrieve all courses') 
      };
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('title', { ascending: true });
    
    return { data, error };
  },

  // Get all courses the user has access to
  getAccessibleCourses: async (userId: string) => {
    // Get user's Discord roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);
    
    if (!userRoles) return { data: [], error: null };
    
    const roleIds = userRoles.map(role => role.discord_role_id);
    
    // Get courses that match user's roles
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_roles!inner(discord_role_id)
      `)
      .in('course_roles.discord_role_id', roleIds);
    
    return { data, error };
  },
  
  getCourseBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return { data, error };
  },
  
  getCourseById: async (id: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },
  
  createCourse: async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Creating course with data:', course);
    
    // Get the current user with their metadata to check for admin status by provider_id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        data: null, 
        error: new Error('User not authenticated') 
      };
    }
    
    console.log('User attempting to create course:', {
      id: user.id,
      providerId: user.user_metadata?.provider_id,
      userId: user.id,
      metadata: user.user_metadata,
      adminIds: ADMIN_DISCORD_IDS
    });
    
    // Cast user to ExtendedUser type for TypeScript
    const extendedUser = user as ExtendedUser;
    
    // Enhanced admin check that matches our AdminContext and MainLayout checks
    const providerId = extendedUser.user_metadata?.provider_id;
    const discordId = extendedUser.discord_id || 
                    extendedUser.user_metadata?.discord_id || 
                    extendedUser.user_metadata?.provider_id || 
                    '';
    
    // Check admin status from all possible sources
    const isAdmin = !!extendedUser.is_admin || 
                  !!extendedUser.user_metadata?.is_admin ||
                  (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
                  (extendedUser.id && ADMIN_DISCORD_IDS.includes(extendedUser.id));
    
    console.log("Admin check for course creation:", {
      isAdmin,
      userId: extendedUser.id,
      discordId,
      userIsAdmin: extendedUser.is_admin,
      metadataIsAdmin: extendedUser.user_metadata?.is_admin
    });
    
    if (!isAdmin) {
      console.error('User is not an admin. User ID:', user.id);
      return { 
        data: null, 
        error: new Error('Only admin users can create courses') 
      };
    }
    
    try {
      // First, check if a course with the same slug already exists
      const { data: existingCourse, error: checkError } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', course.slug)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing course:', checkError);
        return { data: null, error: checkError };
      }
      
      if (existingCourse) {
        return { 
          data: null, 
          error: new Error(`A course with the slug "${course.slug}" already exists`) 
        };
      }
      
      // Use RPC to create course if user is admin
      const { data, error } = await supabase
        .rpc('create_course', {
          course_title: course.title,
          course_slug: course.slug,
          course_description: course.description,
          course_thumbnail_url: course.thumbnail_url
        });
      
      if (error) {
        console.error('Error creating course via RPC:', error);
        return { data: null, error };
      }
      
      if (!data) {
        console.error('No course ID returned from create_course RPC');
        return { 
          data: null, 
          error: new Error('Failed to create course: No course ID returned') 
        };
      }
      
      // Fetch the newly created course to ensure we have all the data
      const { data: newCourse, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', data)
        .single();
      
      if (fetchError) {
        console.error('Error fetching newly created course:', fetchError);
        return { 
          data: null, 
          error: new Error(`Course created but failed to fetch details: ${fetchError.message}`) 
        };
      }
      
      return { data: newCourse, error: null };
    } catch (err) {
      console.error('Unexpected error in createCourse:', err);
      return { 
        data: null, 
        error: new Error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`) 
      };
    }
  },
  
  updateCourse: async (id: string, updates: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>) => {
    // Check admin status
    if (!(await courseService.isUserAdmin())) {
      return { 
        data: null, 
        error: new Error('Only admin users can update courses') 
      };
    }
    
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  deleteCourse: async (id: string) => {
    // Check admin status
    if (!(await courseService.isUserAdmin())) {
      return { error: new Error('Only admin users can delete courses') };
    }
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};
