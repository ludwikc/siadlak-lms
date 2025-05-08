
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import CourseEditForm from './components/CourseEditForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CourseModulesList from './components/CourseModulesList';
import CourseRoleAssignmentTable from './components/CourseRoleAssignmentTable';

const AdminCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const { user } = useAuth();

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
            <CourseRoleAssignmentTable courseId={courseId} />
          </div>
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminCourseEditPage;
