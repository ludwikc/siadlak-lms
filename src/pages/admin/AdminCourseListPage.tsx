
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/lib/supabase/types';
import { Edit, Trash, Plus, Eye, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DummyCourseButton from '@/components/admin/DummyCourseButton';

const AdminCourseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Fetch all courses
  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    }
  });

  // Handle course deletion
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id);
      
      if (error) throw error;
      
      toast.success(`Course "${courseToDelete.title}" deleted successfully`);
      setCourseToDelete(null);
      refetch();
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('Failed to delete course');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold text-discord-header-text">Something went wrong</h2>
          <p className="mb-6 text-discord-secondary-text">Failed to load courses</p>
          <button
            onClick={() => refetch()}
            className="rounded-md bg-discord-brand px-4 py-2 text-white transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-discord-header-text">Manage Courses</h1>
          <p className="text-discord-secondary-text">Create, edit, and delete courses</p>
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <DummyCourseButton />
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center gap-2 rounded-md bg-discord-brand px-4 py-2 text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>New Course</span>
          </Link>
        </div>
      </header>

      {/* Courses table */}
      <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg overflow-hidden">
        {courses && courses.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-discord-sidebar-bg">
                <TableRow>
                  <TableHead className="text-discord-header-text">Title</TableHead>
                  <TableHead className="text-discord-header-text">Slug</TableHead>
                  <TableHead className="text-discord-header-text">Created</TableHead>
                  <TableHead className="text-discord-header-text">Updated</TableHead>
                  <TableHead className="text-right text-discord-header-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className="border-t border-discord-sidebar-bg hover:bg-discord-sidebar-bg/50">
                    <TableCell className="font-medium text-discord-header-text">
                      {course.title}
                    </TableCell>
                    <TableCell className="text-discord-secondary-text">
                      {course.slug}
                    </TableCell>
                    <TableCell className="text-discord-secondary-text">
                      {new Date(course.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-discord-secondary-text">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        to={`/courses/${course.slug}`}
                        className="rounded p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
                        title="View course"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        to={`/admin/courses/${course.id}`}
                        className="rounded p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
                        title="Edit course"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => setCourseToDelete(course)}
                        className="rounded p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-brand"
                        title="Delete course"
                      >
                        <Trash size={18} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-discord-sidebar-bg p-3">
              <FilePlus className="h-8 w-8 text-discord-secondary-text" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-discord-header-text">
              No courses found
            </h3>
            <p className="mb-6 text-discord-secondary-text">
              Get started by creating your first course
            </p>
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-2 rounded-md bg-discord-brand px-4 py-2 text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>Create Course</span>
            </Link>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="bg-discord-deep-bg border-discord-sidebar-bg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-discord-header-text">
              Delete Course
            </AlertDialogTitle>
            <AlertDialogDescription className="text-discord-secondary-text">
              Are you sure you want to delete the course "{courseToDelete?.title}"? This action cannot be undone and all related modules and lessons will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-discord-sidebar-bg text-discord-header-text border-discord-sidebar-bg hover:bg-discord-sidebar-bg/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-discord-brand text-white hover:bg-discord-brand/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCourseListPage;
