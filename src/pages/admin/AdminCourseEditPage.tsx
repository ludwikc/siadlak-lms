
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { CourseEditForm } from './components/CourseEditForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CourseModulesList from './components/CourseModulesList';
import CourseRoleAssignmentTable from './components/CourseRoleAssignmentTable';
import { courseService } from '@/lib/supabase/services';
import { toast } from 'sonner';
import { Course } from '@/lib/supabase/types';

const AdminCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch course data if we're editing
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await courseService.getCourseById(courseId);
        if (error) throw error;
        setCourse(data);
        
        // Also fetch all courses for the role assignment table
        const allCoursesResult = await courseService.getAllCourses();
        if (allCoursesResult.error) throw allCoursesResult.error;
        setCourses(allCoursesResult.data || []);
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  return (
    <AdminGuard>
      <div className="animate-fade-in space-y-8">
        <header>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-discord-header-text">
              {isEditing ? 'Edit Course' : 'Create New Course'}
            </h1>
            {isEditing && (
              <Link to={`/courses/${courseId}`}>
                <Button variant="outline">View Course</Button>
              </Link>
            )}
          </div>
        </header>

        <CourseEditForm courseId={courseId} />

        {/* Only show modules and roles if we're editing an existing course */}
        {isEditing && (
          <div className="grid gap-6 lg:grid-cols-1">
            <CourseModulesList courseId={courseId} />
            {courses.length > 0 && (
              <CourseRoleAssignmentTable 
                discordRoles={[]} // This will need to be populated with actual discord roles
                courses={courses}
                assigned={{}} // This will need to be populated with actual role assignments
                toggleRoleCourse={() => {}} // This will need to be implemented
                onSave={() => {}} // This will need to be implemented
                isSaving={false}
              />
            )}
          </div>
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminCourseEditPage;
