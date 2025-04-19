
import { supabase } from '../client';
import type { UserProgress, Course, Module } from '../types';
import { moduleService } from './module.service';
import { courseService } from './course.service';
import { lessonService } from './lesson.service';
import { toast } from 'sonner';

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
    
    if (!modules || modules.length === 0) return { data: [], error: null, completion: 0 };
    
    const moduleIds = modules.map(module => module.id);
    
    // Get all lessons for the modules
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds);
    
    if (!lessons || lessons.length === 0) return { data: [], error: null, completion: 0 };
    
    const lessonIds = lessons.map(lesson => lesson.id);
    
    // Get user's progress for all lessons
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);
    
    // Calculate completion percentage
    const completedLessons = data?.filter(progress => progress.completed)?.length || 0;
    const completionPercentage = lessons.length > 0 
      ? Math.round((completedLessons / lessons.length) * 100) 
      : 0;
    
    return { data, error, completion: completionPercentage };
  },
  
  getUserAllCoursesProgress: async (userId: string) => {
    try {
      // Get all accessible courses
      const { data: courses } = await courseService.getAccessibleCourses(userId);
      
      if (!courses || courses.length === 0) return { data: [], error: null };
      
      // Get progress for each course
      const progressPromises = courses.map(async (course) => {
        const { data: progressData, completion } = await progressService.getUserCourseProgress(userId, course.id);
        return {
          course,
          progress: progressData || [],
          completion
        };
      });
      
      const coursesWithProgress = await Promise.all(progressPromises);
      
      return { data: coursesWithProgress, error: null };
    } catch (error) {
      console.error('Error fetching all courses progress:', error);
      return { data: [], error };
    }
  },

  getUserLastAccessedLesson: async (userId: string) => {
    try {
      // Get the most recently updated progress entry
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return { data: null, error: error || new Error('No lesson found') };
      }
      
      // Get the lesson details
      const { data: lesson } = await lessonService.getLessonById(data.lesson_id);
      if (!lesson) {
        return { data: null, error: new Error('Lesson not found') };
      }
      
      // Get the module details
      const { data: module } = await moduleService.getModuleById(lesson.module_id);
      if (!module) {
        return { data: null, error: new Error('Module not found') };
      }
      
      // Get the course details
      const { data: course } = await courseService.getCourseById(module.course_id);
      if (!course) {
        return { data: null, error: new Error('Course not found') };
      }
      
      return { 
        data: {
          progress: data,
          lesson,
          module,
          course
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching last accessed lesson:', error);
      return { data: null, error };
    }
  },
  
  updateUserProgress: async (progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>) => {
    // First check if a record already exists
    const { data: existingProgress } = await progressService.getUserLessonProgress(
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
      toast.error('Failed to update progress');
      return { data: null, error };
    }
  },

  // For auto-marking lessons as complete
  autoMarkLessonComplete: async (userId: string, lessonId: string, progress: number) => {
    try {
      // Get the lesson to determine media type
      const { data: lesson } = await lessonService.getLessonById(lessonId);
      if (!lesson) throw new Error('Lesson not found');
      
      // Get current progress
      const { data: currentProgress } = await progressService.getUserLessonProgress(userId, lessonId);
      
      // For video/audio, mark as complete if watched 90% or more
      if ((lesson.media_type === 'video' || lesson.media_type === 'audio') && progress >= 0.9) {
        return await progressService.updateUserProgress({
          user_id: userId,
          lesson_id: lessonId,
          completed: true,
          last_position: progress
        });
      }
      
      // For text lessons with scrolling, mark update progress and maintain completion state
      return await progressService.updateUserProgress({
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
  
  markTextLessonAsReadAtBottom: async (userId: string, lessonId: string) => {
    try {
      return await progressService.updateUserProgress({
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
