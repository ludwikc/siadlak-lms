
import { supabase } from '../client';
import type { Course } from '../types';
import { ADMIN_DISCORD_IDS } from '@/types/auth';

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
    
    console.log('User attempting to create course:', {
      id: user.id,
      providerId: user.user_metadata?.provider_id,
      userId: user.id,
      metadata: user.user_metadata,
      adminIds: ADMIN_DISCORD_IDS
    });
    
    // Enhanced admin check that matches our AdminContext and MainLayout checks
    const providerId = user.user_metadata?.provider_id;
    const discordId = user.user_metadata?.provider_id || user.user_metadata?.discord_id;
    
    // Check admin status from multiple sources
    const isAdmin = 
      (providerId && ADMIN_DISCORD_IDS.includes(providerId)) ||
      (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
      (user.id && ADMIN_DISCORD_IDS.includes(user.id));
    
    if (!isAdmin) {
      console.error('User is not an admin. User ID:', user.id);
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
    
    // Enhanced admin check that matches our AdminContext and MainLayout checks
    const providerId = user.user_metadata?.provider_id;
    const discordId = user.user_metadata?.provider_id || user.user_metadata?.discord_id;
    
    // Check admin status from multiple sources
    const isAdmin = 
      (providerId && ADMIN_DISCORD_IDS.includes(providerId)) ||
      (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
      (user.id && ADMIN_DISCORD_IDS.includes(user.id));
    
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
    
    // Enhanced admin check that matches our AdminContext and MainLayout checks
    const providerId = user.user_metadata?.provider_id;
    const discordId = user.user_metadata?.provider_id || user.user_metadata?.discord_id;
    
    // Check admin status from multiple sources
    const isAdmin = 
      (providerId && ADMIN_DISCORD_IDS.includes(providerId)) ||
      (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
      (user.id && ADMIN_DISCORD_IDS.includes(user.id));
    
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
