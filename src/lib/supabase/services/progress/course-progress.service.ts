import { supabase } from '../../client';
import { moduleService } from '../module.service';
import { courseService } from '../course.service';

export const courseProgressService = {
  getUserCourseProgress: async (userId: string, courseId: string) => {
    try {
      // Get all modules for the course
      const { data: modules } = await moduleService.getModulesByCourseId(courseId);
      
      if (!modules || modules.length === 0) {
        console.log(`No modules found for course ${courseId}`);
        return { data: [], error: null, completion: 0 };
      }
      
      console.log(`Found ${modules.length} modules for course ${courseId}`);
      const moduleIds = modules.map(module => module.id);
      
      // Get all lessons for the modules
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds);
      
      if (!lessons || lessons.length === 0) {
        console.log(`No lessons found for course ${courseId} modules`);
        return { data: [], error: null, completion: 0 };
      }
      
      console.log(`Found ${lessons.length} lessons for course ${courseId}`);
      const lessonIds = lessons.map(lesson => lesson.id);
      
      // Get user's progress for all lessons
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);
      
      // Calculate completion percentage
      // If there are no lessons we set completion to 0
      // If there are lessons but no progress we also set it to 0
      // Otherwise we calculate based on completed lessons
      let completionPercentage = 0;
      if (lessons.length > 0) {
        const completedLessons = (data || []).filter(progress => progress.completed).length;
        completionPercentage = Math.round((completedLessons / lessons.length) * 100);
      }
      
      console.log(`User ${userId} has completed ${data?.filter(p => p.completed).length || 0}/${lessons.length} lessons (${completionPercentage}%) for course ${courseId}`);
      
      return { data, error, completion: completionPercentage };
    } catch (error) {
      console.error('Error in getUserCourseProgress:', error);
      return { data: [], error, completion: 0 };
    }
  },
  
  getUserAllCoursesProgress: async (userId: string) => {
    try {
      // Get all accessible courses
      const { data: courses, error } = await courseService.getAccessibleCourses(userId);
      
      if (error) {
        console.error('Error getting accessible courses:', error);
        return { data: [], error };
      }
      
      if (!courses || courses.length === 0) {
        console.log(`No accessible courses found for user ${userId}`);
        return { data: [], error: null };
      }
      
      console.log(`Found ${courses.length} accessible courses for user ${userId}`);
      
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
      console.log(`Processed progress for ${coursesWithProgress.length} courses`);
      
      return { data: coursesWithProgress, error: null };
    } catch (error) {
      console.error('Error fetching all courses progress:', error);
      return { data: [], error };
    }
  }
};
