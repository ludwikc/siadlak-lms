
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
    try {
      console.log('Creating lesson with RPC function:', lesson);
      
      const { data, error } = await supabase.rpc('create_lesson', {
        lesson_title: lesson.title,
        lesson_slug: lesson.slug,
        lesson_module_id: lesson.module_id,
        lesson_order_index: lesson.order_index,
        lesson_content: lesson.content || null,
        lesson_media_type: lesson.media_type || null,
        lesson_media_url: lesson.media_url || null,
        lesson_transcript: lesson.transcript || null,
        lesson_published: lesson.published || false
      });
      
      if (error) {
        console.error('Error in create_lesson RPC:', error);
        return { data: null, error };
      }
      
      // If successful, fetch the created lesson
      if (data) {
        const { data: lessonData } = await lessonService.getLessonById(data);
        return { data: lessonData, error: null };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception in createLesson:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error creating lesson') 
      };
    }
  },
  
  updateLesson: async (id: string, updates: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      console.log('Updating lesson with RPC function:', { id, updates });
      
      const { data, error } = await supabase.rpc('update_lesson', {
        lesson_id: id,
        lesson_title: updates.title,
        lesson_slug: updates.slug,
        lesson_module_id: updates.module_id,
        lesson_order_index: updates.order_index,
        lesson_content: updates.content,
        lesson_media_type: updates.media_type,
        lesson_media_url: updates.media_url,
        lesson_transcript: updates.transcript,
        lesson_published: updates.published
      });
      
      if (error) {
        console.error('Error in update_lesson RPC:', error);
        return { data: null, error };
      }
      
      // If successful, fetch the updated lesson
      if (data) {
        const { data: lessonData } = await lessonService.getLessonById(id);
        return { data: lessonData, error: null };
      }
      
      return { data: null, error: new Error('Lesson not found after update') };
    } catch (error) {
      console.error('Exception in updateLesson:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error updating lesson') 
      };
    }
  },
  
  deleteLesson: async (id: string) => {
    try {
      console.log('Deleting lesson with RPC function:', id);
      
      const { data, error } = await supabase.rpc('delete_lesson', {
        lesson_id: id
      });
      
      if (error) {
        console.error('Error in delete_lesson RPC:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('Exception in deleteLesson:', error);
      return { 
        error: error instanceof Error ? error : new Error('Unknown error deleting lesson') 
      };
    }
  },
  
  reorderLessons: async (moduleId: string, orderedIds: string[]) => {
    try {
      console.log('Reordering lessons with RPC function:', { moduleId, orderedIds });
      
      const { data, error } = await supabase.rpc('reorder_lessons', {
        module_id: moduleId,
        lesson_ids: orderedIds
      });
      
      if (error) {
        console.error('Error in reorder_lessons RPC:', error);
      }
      
      return { error };
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
