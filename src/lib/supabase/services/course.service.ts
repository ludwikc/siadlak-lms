
import { supabase } from '../client';
import type { Course } from '../types';

export const courseService = {
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
    
    // Check if user is admin based on provider_id (Discord ID)
    const ADMIN_IDS = ['404038151565213696', '1040257455592050768'];
    const providerId = user.user_metadata?.provider_id;
    
    console.log('Checking admin status with provider_id:', providerId);
    
    const isAdmin = providerId && ADMIN_IDS.includes(providerId);
    
    if (!isAdmin) {
      console.error('User is not an admin. provider_id:', providerId);
      return { 
        data: null, 
        error: new Error('Only admin users can create courses') 
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
    
    // Return the newly created course
    return { 
      data: {
        id: data,
        ...course,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, 
      error: null 
    };
  },
  
  updateCourse: async (id: string, updates: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>) => {
    // Get the current user with their metadata to check for admin status by provider_id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        data: null, 
        error: new Error('User not authenticated') 
      };
    }
    
    // Check if user is admin based on provider_id (Discord ID)
    const ADMIN_IDS = ['404038151565213696', '1040257455592050768'];
    const providerId = user.user_metadata?.provider_id;
    const isAdmin = providerId && ADMIN_IDS.includes(providerId);
    
    if (!isAdmin) {
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
    // Get the current user with their metadata to check for admin status by provider_id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    
    // Check if user is admin based on provider_id (Discord ID)
    const ADMIN_IDS = ['404038151565213696', '1040257455592050768'];
    const providerId = user.user_metadata?.provider_id;
    const isAdmin = providerId && ADMIN_IDS.includes(providerId);
    
    if (!isAdmin) {
      return { error: new Error('Only admin users can delete courses') };
    }
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};
