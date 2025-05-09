
import { Course, Lesson, Module } from '@/lib/supabase/types';

export interface CourseProgressInfo {
  course: Course;
  progress: any[]; // User progress records
  completion: number; // Percentage from 0-100
}

export interface LastVisitedInfo {
  course: Course;
  module: Module;
  lesson: Lesson;
  progress: any; // Progress record
}

// Type for role-based course access
export interface CourseAccess {
  courseId: string;
  hasAccess: boolean;
}
