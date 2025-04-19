
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
  
  createCourse: async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single();
    
    return { data, error };
  },
  
  updateCourse: async (id: string, updates: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  deleteCourse: async (id: string) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};
