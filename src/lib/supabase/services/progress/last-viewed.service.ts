
import { supabase } from '../../client';
import { lessonService } from '../lesson.service';
import { moduleService } from '../module.service';
import { courseService } from '../course.service';

export const lastViewedService = {
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
  }
};
