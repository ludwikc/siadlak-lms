import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ui/error-state';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/lib/supabase/services';
import type { Course } from '@/lib/supabase/types';
import { CourseEditForm, courseFormSchema, CourseFormValues } from './components/CourseEditForm';
import CourseThumbnail from './components/CourseThumbnail';
import AdminModulesCard from './components/AdminModulesCard';

const ADMIN_IDS = ['404038151565213696', '1040257455592050768'];

const AdminCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!courseId;

  const verifiedAdmin = React.useMemo(() => {
    const providerId = user?.user_metadata?.provider_id;
    return !!providerId && ADMIN_IDS.includes(providerId);
  }, [user]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      thumbnail_url: '',
    }
  });

  const { isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await courseService.getCourseById(courseId);
      if (error) throw error;
      form.reset({
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        thumbnail_url: data.thumbnail_url || '',
      });
      return data;
    },
    enabled: isEditing,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      if (isEditing && courseId) {
        const { data, error } = await courseService.updateCourse(courseId, values);
        if (error) throw error;
        return data;
      } else {
        const courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
          title: values.title,
          slug: values.slug,
          description: values.description || null,
          thumbnail_url: values.thumbnail_url || null
        };
        const { data, error } = await courseService.createCourse(courseData);
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(isEditing ? 'Course updated successfully' : 'Course created successfully');
      navigate(`/admin/courses/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to save course: ${error?.message || 'Unknown error'}`);
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    saveMutation.mutate(values);
  };

  const generateSlug = () => {
    const title = form.getValues('title');
    if (!title) return;
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    form.setValue('slug', slug);
  };

  if (!verifiedAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-discord-header-text">Access Denied</h1>
        <ErrorState 
          title="Admin Access Required"
          message="You need administrator privileges to manage courses."
          severity="error"
          actionLabel="Go to Home"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  if (isLoading && isEditing) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/courses')}
            className="rounded-md p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-discord-header-text">
            {isEditing ? 'Edit Course' : 'Create New Course'}
          </h1>
        </div>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={saveMutation.isPending}
          className="bg-discord-brand text-white hover:bg-discord-brand/90"
        >
          <Save className="h-4 w-4 mr-2" />
          <span>{saveMutation.isPending ? 'Saving...' : 'Save Course'}</span>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
            <CardHeader>
              <CardTitle className="text-discord-header-text">Course Details</CardTitle>
              <CardDescription className="text-discord-secondary-text">
                Basic information about your course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseEditForm form={form} onSubmit={onSubmit} generateSlug={generateSlug} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
            <CardHeader>
              <CardTitle className="text-discord-header-text">Thumbnail</CardTitle>
              <CardDescription className="text-discord-secondary-text">
                Course preview image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseThumbnail
                url={form.watch('thumbnail_url')}
                onRemove={() => form.setValue('thumbnail_url', '')}
              />
            </CardContent>
          </Card>

          {isEditing && courseId && (
            <AdminModulesCard courseId={courseId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCourseEditPage;
