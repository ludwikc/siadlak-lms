
import { supabase } from '../client';
import type { Lesson } from '../types';
import { moduleService } from './module.service';
import { ADMIN_DISCORD_IDS } from '@/types/auth';
import type { ExtendedUser } from '@/types/auth';

export const lessonService = {
  getLessonsByModuleId: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
  getLessonBySlug: async (courseSlug: string, moduleSlug: string, lessonSlug: string) => {
    // First get the module
    const { data: module } = await moduleService.getModuleBySlug(courseSlug, moduleSlug);
    
    if (!module) return { data: null, error: new Error('Module not found') };
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', module.id)
      .eq('slug', lessonSlug)
      .single();
    
    return { data, error };
  },
  
  getLessonById: async (id: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },
  
  // Check if user is admin before creating/updating/deleting lessons
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
  
  createLesson: async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    // Check admin status
    if (!(await lessonService.isUserAdmin())) {
      return { 
        data: null, 
        error: new Error('Only admin users can create lessons') 
      };
    }
    
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();
    
    return { data, error };
  },
  
  updateLesson: async (id: string, updates: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>) => {
    // Check admin status
    if (!(await lessonService.isUserAdmin())) {
      return { 
        data: null, 
        error: new Error('Only admin users can update lessons') 
      };
    }
    
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  deleteLesson: async (id: string) => {
    // Check admin status
    if (!(await lessonService.isUserAdmin())) {
      return { error: new Error('Only admin users can delete lessons') };
    }
    
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    
    return { error };
  },
  
  reorderLessons: async (moduleId: string, orderedIds: string[]) => {
    // Check admin status
    if (!(await lessonService.isUserAdmin())) {
      return { 
        error: new Error('Only admin users can reorder lessons') 
      };
    }
    
    try {
      // We need to update each lesson with its new order_index
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from('lessons')
          .update({ order_index: i })
          .eq('id', orderedIds[i])
          .eq('module_id', moduleId); // Extra safety check
        
        if (error) throw error;
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error reordering lessons:', error);
      return { error };
    }
  },
  
  updateLessonMediaProgress: async (lessonId: string, userId: string, position: number, duration: number) => {
    if (!userId || !lessonId) return { error: new Error('User ID and Lesson ID are required') };
    
    try {
      const completed = position / duration >= 0.9;
      
      // Check if there's already a progress entry
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      
      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('user_progress')
          .update({ 
            last_position: position,
            completed: completed || existingProgress.completed,
            completed_at: completed && !existingProgress.completed ? new Date().toISOString() : existingProgress.completed_at
          })
          .eq('id', existingProgress.id);
        
        return { error };
      } else {
        // Create new progress entry
        const { error } = await supabase
          .from('user_progress')
          .insert({ 
            user_id: userId,
            lesson_id: lessonId,
            last_position: position,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          });
        
        return { error };
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      return { error };
    }
  },
  
  markLessonComplete: async (lessonId: string, userId: string) => {
    if (!userId || !lessonId) return { error: new Error('User ID and Lesson ID are required') };
    
    try {
      // Check if there's already a progress entry
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      
      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('user_progress')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
        
        return { error };
      } else {
        // Create new progress entry
        const { error } = await supabase
          .from('user_progress')
          .insert({ 
            user_id: userId,
            lesson_id: lessonId,
            last_position: 1, // 100% complete
            completed: true,
            completed_at: new Date().toISOString()
          });
        
        return { error };
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      return { error };
    }
  }
};
