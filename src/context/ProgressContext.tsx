
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { progressService } from '@/lib/supabase/services';
import { toast } from 'sonner';
import { preferencesService } from '@/lib/supabase/services/preferences.service';
import type { Course, Lesson, Module } from '@/lib/supabase/types';
import { CourseProgressInfo, LastVisitedInfo } from '@/types/progress';
import { courseService } from '@/lib/supabase/services/course.service';

interface ProgressContextType {
  isLoading: boolean;
  coursesProgress: CourseProgressInfo[];
  lastVisited: LastVisitedInfo | null;
  refreshProgress: () => Promise<void>;
  markLessonComplete: (lessonId: string, completed: boolean) => Promise<void>;
  updatePlaybackPosition: (lessonId: string, position: number) => Promise<void>;
  trackMediaProgress: (lessonId: string, position: number, duration: number) => Promise<void>;
  markTextLessonComplete: (lessonId: string) => Promise<void>;
}

// Create context with default values
const ProgressContext = createContext<ProgressContextType>({
  isLoading: true,
  coursesProgress: [],
  lastVisited: null,
  refreshProgress: async () => {},
  markLessonComplete: async () => {},
  updatePlaybackPosition: async () => {},
  trackMediaProgress: async () => {},
  markTextLessonComplete: async () => {},
});

// Custom hook to use progress context
export const useProgress = () => useContext(ProgressContext);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [coursesProgress, setCoursesProgress] = useState<CourseProgressInfo[]>([]);
  const [lastVisited, setLastVisited] = useState<LastVisitedInfo | null>(null);
  
  // Fetch progress data
  const fetchProgressData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch courses based on access
      const { data: accessibleCourses } = await courseService.getAccessibleCourses(user.id, isAdmin);
      console.log('Accessible courses for user:', accessibleCourses);
      
      if (!accessibleCourses || accessibleCourses.length === 0) {
        // No accessible courses
        setCoursesProgress([]);
        setIsLoading(false);
        return;
      }
      
      // Get progress data for each accessible course
      const coursesProgressData: CourseProgressInfo[] = [];
      
      for (const course of accessibleCourses) {
        const { data: progressData, completion } = await progressService.courseProgressService.getUserCourseProgress(user.id, course.id);
        
        coursesProgressData.push({
          course,
          progress: progressData || [],
          completion: completion || 0
        });
      }
      
      setCoursesProgress(coursesProgressData);
      console.log('Courses with progress:', coursesProgressData);
      
      // Fetch last accessed lesson
      const { data: lastAccessedData } = await progressService.getUserLastAccessedLesson(user.id);
      if (lastAccessedData) {
        setLastVisited(lastAccessedData);
        
        // Update user preferences with last visited
        await preferencesService.updateLastVisited(
          user.id, 
          lastAccessedData.course.id,
          lastAccessedData.module.id,
          lastAccessedData.lesson.id
        );
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to load your progress data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh progress data
  const refreshProgress = async () => {
    await fetchProgressData();
  };
  
  // Mark lesson as complete/incomplete
  const markLessonComplete = async (lessonId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      const { error } = await progressService.updateUserProgress({
        user_id: user.id,
        lesson_id: lessonId,
        completed,
        last_position: 0, // This can be updated separately
      });
      
      if (error) throw error;
      
      // Update local state
      await refreshProgress();
      
      // Show success toast
      toast.success(completed ? 'Lesson marked as complete' : 'Lesson marked as incomplete');
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Failed to update lesson status');
    }
  };
  
  // Update playback position
  const updatePlaybackPosition = async (lessonId: string, position: number) => {
    if (!user) return;
    
    try {
      const { data: existingProgress } = await progressService.getUserLessonProgress(user.id, lessonId);
      
      await progressService.updateUserProgress({
        user_id: user.id,
        lesson_id: lessonId,
        completed: existingProgress?.completed || false,
        last_position: position,
      });
      
      // No need to refresh all progress or show a toast for silent updates
    } catch (error) {
      console.error('Error updating playback position:', error);
    }
  };
  
  // Track media progress and auto-mark as complete if necessary
  const trackMediaProgress = async (lessonId: string, position: number, duration: number) => {
    if (!user || !duration) return;
    
    try {
      const normalizedPosition = position / duration; // 0 to 1
      
      await progressService.autoMarkLessonComplete(user.id, lessonId, normalizedPosition);
      
      // We don't refresh the entire progress here for performance reasons
      // If the lesson was marked complete, it will be reflected next time progress is refreshed
    } catch (error) {
      console.error('Error tracking media progress:', error);
    }
  };
  
  // Mark text lesson as complete when scrolled to bottom
  const markTextLessonComplete = async (lessonId: string) => {
    if (!user) return;
    
    try {
      await progressService.markTextLessonComplete(user.id, lessonId);
      
      // Update local state
      await refreshProgress();
      
      // Show subtle toast
      toast.success('Lesson marked as complete', { duration: 2000 });
    } catch (error) {
      console.error('Error marking text lesson as complete:', error);
    }
  };
  
  // Initial load
  useEffect(() => {
    if (user) {
      console.log('User is authenticated, fetching progress data', { userId: user.id, isAdmin });
      fetchProgressData();
    } else {
      setIsLoading(false);
      setCoursesProgress([]);
      setLastVisited(null);
    }
    
    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.log('Forced loading state to complete after timeout');
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [user, isAdmin]);
  
  // Value to provide to consumers
  const value: ProgressContextType = {
    isLoading,
    coursesProgress,
    lastVisited,
    refreshProgress,
    markLessonComplete,
    updatePlaybackPosition,
    trackMediaProgress,
    markTextLessonComplete,
  };
  
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
