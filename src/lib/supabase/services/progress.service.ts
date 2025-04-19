
import { supabase } from '../client';
import type { UserProgress } from '../types';
import { moduleService } from './module.service';

export const progressService = {
  getUserLessonProgress: async (userId: string, lessonId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();
    
    return { data, error };
  },
  
  getUserCourseProgress: async (userId: string, courseId: string) => {
    // Get all modules for the course
    const { data: modules } = await moduleService.getModulesByCourseId(courseId);
    
    if (!modules || modules.length === 0) return { data: [], error: null };
    
    const moduleIds = modules.map(module => module.id);
    
    // Get all lessons for the modules
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds);
    
    if (!lessons || lessons.length === 0) return { data: [], error: null };
    
    const lessonIds = lessons.map(lesson => lesson.id);
    
    // Get user's progress for all lessons
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);
    
    return { data, error };
  },
  
  updateUserProgress: async (progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>) => {
    // First check if a record already exists
    const { data: existingProgress } = await progressService.getUserLessonProgress(
      progress.user_id,
      progress.lesson_id
    );
    
    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_progress')
        .update(progress)
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      return { data, error };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_progress')
        .insert(progress)
        .select()
        .single();
      
      return { data, error };
    }
  }
};
