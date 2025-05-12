
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Button } from '@/components/ui/button';
import DummyCourseButton from '@/components/admin/DummyCourseButton';
import ComprehensiveTestCourseButton from '@/components/admin/ComprehensiveTestCourseButton';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/lib/supabase/services';

const AdminDashboardPage: React.FC = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await courseService.getAllCourses();
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <AdminGuard>
      <div className="animate-fade-in space-y-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-discord-header-text">Admin Dashboard</h1>
          <p className="text-discord-secondary-text">Manage courses, modules, and lessons</p>
        </header>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-discord-header-text">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/courses/new">
              <Button>Create New Course</Button>
            </Link>
            <DummyCourseButton />
            <ComprehensiveTestCourseButton />
          </div>
        </section>

        {/* Courses List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-discord-header-text">Courses</h2>
            <Link to="/admin/courses">
              <Button variant="outline">View All Courses</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <Card key={course.id} className="bg-discord-deep-bg border-discord-sidebar-bg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-discord-header-text">{course.title}</CardTitle>
                    <CardDescription className="text-discord-secondary-text line-clamp-2">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <Link to={`/admin/courses/${course.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/courses/${course.slug}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-4 text-discord-secondary-text">No courses found</p>
                <Link to="/admin/courses/new">
                  <Button>Create Your First Course</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboardPage;
