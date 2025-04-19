
import { supabase } from '../../client';
import { moduleService } from '../module.service';
import { courseService } from '../course.service';

export const courseProgressService = {
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
        const { data: progressData, completion } = await courseProgressService.getUserCourseProgress(userId, course.id);
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
  }
};
