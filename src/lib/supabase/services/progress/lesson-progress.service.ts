
import { supabase } from '../../client';
import type { UserProgress } from '../../types';

export const lessonProgressService = {
  getUserLessonProgress: async (userId: string, lessonId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();
    
    return { data, error };
  },

  updateUserProgress: async (progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>) => {
    // First check if a record already exists
    const { data: existingProgress } = await lessonProgressService.getUserLessonProgress(
      progress.user_id,
      progress.lesson_id
    );
    
    try {
      let result;
      if (existingProgress) {
        // Update existing record
        result = await supabase
          .from('user_progress')
          .update(progress)
          .eq('id', existingProgress.id)
          .select()
          .single();
      } else {
        // Create new record
        result = await supabase
          .from('user_progress')
          .insert(progress)
          .select()
          .single();
      }
      
      const { data, error } = result;
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { data: null, error };
    }
  },

  autoMarkLessonComplete: async (userId: string, lessonId: string, progress: number) => {
    try {
      // Get current progress
      const { data: currentProgress } = await lessonProgressService.getUserLessonProgress(userId, lessonId);
      
      // For video/audio, mark as complete if watched 90% or more
      if (progress >= 0.9) {
        return await lessonProgressService.updateUserProgress({
          user_id: userId,
          lesson_id: lessonId,
          completed: true,
          last_position: progress
        });
      }
      
      // For text lessons with scrolling, mark update progress and maintain completion state
      return await lessonProgressService.updateUserProgress({
        user_id: userId,
        lesson_id: lessonId,
        completed: currentProgress?.completed || false,
        last_position: progress
      });
    } catch (error) {
      console.error('Error in auto-marking lesson:', error);
      return { data: null, error };
    }
  },
  
  markTextLessonComplete: async (userId: string, lessonId: string) => {
    try {
      return await lessonProgressService.updateUserProgress({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        last_position: 1 // 1 means 100%
      });
    } catch (error) {
      console.error('Error marking text lesson as read:', error);
      return { data: null, error };
    }
  }
};
