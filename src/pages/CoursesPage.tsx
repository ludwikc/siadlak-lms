
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import CourseCard from '@/components/courses/CourseCard';
import ContinueLearningButton from '@/components/progress/ContinueLearningButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Course } from '@/lib/supabase/types';

const CoursesPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { coursesProgress, isLoading } = useProgress();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  useEffect(() => {
    console.log('CoursesPage - User:', user);
    console.log('CoursesPage - isAdmin:', isAdmin);
    console.log('CoursesPage - coursesProgress:', coursesProgress);
  }, [user, isAdmin, coursesProgress]);
  
  const inProgressCourses = coursesProgress.filter(cp => cp.completion > 0 && cp.completion < 100);
  const completedCourses = coursesProgress.filter(cp => cp.completion === 100);
  const notStartedCourses = coursesProgress.filter(cp => cp.completion === 0);
  
  // Get courses based on active tab
  const getFilteredCourses = () => {
    switch (activeTab) {
      case 'in-progress': return inProgressCourses;
      case 'completed': return completedCourses;
      case 'not-started': return notStartedCourses;
      case 'all':
      default: return coursesProgress;
    }
  };
  
  // Loading states
  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-discord-header-text">Your Courses</h1>
            <p className="text-discord-secondary-text">Continue your learning journey</p>
          </div>
          
          <div className="mt-4 h-10 w-40 animate-pulse rounded-md bg-discord-sidebar-bg md:mt-0"></div>
        </div>
        
        <div className="h-12 w-full max-w-md animate-pulse rounded-md bg-discord-sidebar-bg"></div>
        
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-discord-sidebar-bg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in space-y-8">
      {/* Header with Continue Learning button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-discord-header-text">Your Courses</h1>
          <p className="text-discord-secondary-text">Continue your learning journey</p>
        </div>
        
        <ContinueLearningButton className="mt-4 md:mt-0" />
      </div>
      
      {/* Filter tabs */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="all" className="flex-1">
            All ({coursesProgress.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex-1">
            In Progress ({inProgressCourses.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed ({completedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="not-started" className="flex-1">
            Not Started ({notStartedCourses.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {getFilteredCourses().length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-discord-sidebar-bg p-8 text-center">
              <h2 className="mb-2 text-xl font-semibold text-discord-header-text">
                {isAdmin ? "No courses match the selected filter" : "No courses found"}
              </h2>
              <p className="mb-6 text-discord-secondary-text">
                {activeTab === 'in-progress' && "You don't have any courses in progress."}
                {activeTab === 'completed' && "You haven't completed any courses yet."}
                {activeTab === 'not-started' && "You have started all available courses."}
                {activeTab === 'all' && (isAdmin 
                  ? "You can create courses in the admin section."
                  : "You don't have access to any courses yet.")}
              </p>
              
              {isAdmin && activeTab === 'all' && coursesProgress.length === 0 && (
                <Link to="/admin/courses" className="rounded bg-discord-brand px-4 py-2 text-white hover:bg-discord-brand/90">
                  Create a Course
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredCourses().map(({ course, completion }) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  progress={completion} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursesPage;
