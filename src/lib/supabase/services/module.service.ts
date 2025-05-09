
import { supabase } from '../client';
import type { Module } from '../types';
import { courseService } from './course.service';
import { ADMIN_DISCORD_IDS } from '@/types/auth';
import type { ExtendedUser } from '@/types/auth';

export const moduleService = {
  getModulesByCourseId: async (courseId: string) => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
  getModuleById: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();
    
    return { data, error };
  },
  
  getModuleBySlug: async (courseSlug: string, moduleSlug: string) => {
    // First get the course ID
    const { data: course } = await courseService.getCourseBySlug(courseSlug);
    
    if (!course) return { data: null, error: new Error('Course not found') };
    
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .eq('slug', moduleSlug)
      .single();
    
    return { data, error };
  },
  
  // Check if user is admin before creating/updating/deleting modules
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
  
  createModule: async (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => {
    // Check admin status
    if (!(await moduleService.isUserAdmin())) {
      return { 
        data: null, 
        error: new Error('Only admin users can create modules') 
      };
    }
    
    // Make sure all required fields are present
    if (!module.title || !module.slug || !module.course_id) {
      return { 
        data: null, 
        error: new Error('Missing required fields: title, slug, and course_id are required')
      };
    }

    // Add console.log to debug the module data
    console.log('Creating module with data:', module);
    
    const { data, error } = await supabase
      .from('modules')
      .insert(module)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating module:', error);
    }
    
    return { data, error };
  },
  
  updateModule: async (id: string, updates: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>) => {
    // Check admin status
    if (!(await moduleService.isUserAdmin())) {
      return { 
        data: null, 
        error: new Error('Only admin users can update modules') 
      };
    }
    
    // Add console.log to debug the update data
    console.log('Updating module with ID:', id, 'and data:', updates);
    
    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating module:', error);
    }
    
    return { data, error };
  },
  
  deleteModule: async (id: string) => {
    // Check admin status
    if (!(await moduleService.isUserAdmin())) {
      return { error: new Error('Only admin users can delete modules') };
    }
    
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    
    return { error };
  },
  
  reorderModules: async (courseId: string, orderedIds: string[]) => {
    // Check admin status
    if (!(await moduleService.isUserAdmin())) {
      return { 
        error: new Error('Only admin users can reorder modules') 
      };
    }
    
    try {
      // We need to update each module with its new order_index
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from('modules')
          .update({ order_index: i })
          .eq('id', orderedIds[i])
          .eq('course_id', courseId); // Extra safety check
        
        if (error) throw error;
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error reordering modules:', error);
      return { error };
    }
  }
};
