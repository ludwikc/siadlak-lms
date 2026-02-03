
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { CourseEditForm } from './components/CourseEditForm';
import { Button } from '@/components/ui/button';
import CourseModulesList from './components/CourseModulesList';

const AdminCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);

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

        {/* Show modules list when editing an existing course */}
        {isEditing && (
          <CourseModulesList courseId={courseId} />
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminCourseEditPage;
