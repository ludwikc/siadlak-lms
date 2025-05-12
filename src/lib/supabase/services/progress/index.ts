
import { lessonProgressService } from './lesson-progress.service';
import { lastViewedService } from './last-viewed.service';
import { courseProgressService } from './course-progress.service';

// Export all services from a single module
export const progressService = {
  ...lessonProgressService,
  ...lastViewedService,
  ...courseProgressService,
  
  // Helper functions that use multiple services
  autoMarkLessonComplete: async (userId: string, lessonId: string, normalizedPosition: number) => {
    // Auto-mark as complete if watched most of the content (80%)
    if (normalizedPosition >= 0.8) {
      await lessonProgressService.updateUserProgress({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        last_position: normalizedPosition,
      });
    } else {
      // Just update the position without marking as complete
      await lessonProgressService.updateUserProgress({
        user_id: userId,
        lesson_id: lessonId,
        completed: false,
        last_position: normalizedPosition,
      });
    }
  },
  
  // Mark a text lesson as complete
  markTextLessonComplete: async (userId: string, lessonId: string) => {
    await lessonProgressService.updateUserProgress({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      last_position: 1, // Fully complete
    });
  }
};
