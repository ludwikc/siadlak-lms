import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Image, Plus, Trash } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/lib/supabase/services';
import { authService } from '@/lib/supabase/services';
import type { Course } from '@/lib/supabase/types';
import { ErrorState } from '@/components/ui/error-state';

const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const AdminCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [verifiedAdmin, setVerifiedAdmin] = useState<boolean | null>(null);
  const isEditing = !!courseId;

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (user) {
        console.log('Current user:', user);
        console.log('Auth context isAdmin flag:', isAdmin);
        console.log('User metadata:', user.user_metadata);
        
        if (user.user_metadata?.provider_id) {
          const providerId = user.user_metadata.provider_id as string;
          console.log('Provider ID:', providerId);
          console.log('Is in admin list:', ['404038151565213696', '1040257455592050768'].includes(providerId));
        }
        
        const isDbAdmin = await authService.isAdmin(user.id);
        console.log('Database admin verification result:', isDbAdmin);
        
        const hasAdminProviderId = user.user_metadata?.provider_id && 
          ['404038151565213696', '1040257455592050768'].includes(user.user_metadata.provider_id as string);
        
        setVerifiedAdmin(isAdmin || isDbAdmin || hasAdminProviderId);
      } else {
        setVerifiedAdmin(false);
      }
    };
    
    verifyAdminStatus();
  }, [user, isAdmin]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      thumbnail_url: '',
    },
  });

  const { isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data, error } = await courseService.getCourseById(courseId);
      
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
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
      console.log('Saving course with values:', values);
      console.log('Current user:', user);
      console.log('Is admin from context:', isAdmin);
      console.log('Is admin from database check:', verifiedAdmin);
      
      if (!user || !verifiedAdmin) {
        throw new Error('You must be an admin to save a course');
      }
      
      try {
        if (isEditing && courseId) {
          const { data, error } = await courseService.updateCourse(courseId, values);
          
          if (error) {
            console.error('Error updating course:', error);
            throw error;
          }
          
          console.log('Course updated successfully:', data);
          return data;
        } else {
          const courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
            title: values.title,
            slug: values.slug,
            description: values.description || null,
            thumbnail_url: values.thumbnail_url || null
          };
          
          const { data, error } = await courseService.createCourse(courseData);
          
          if (error) {
            console.error('Error creating course:', error);
            throw error;
          }
          
          console.log('Course created successfully:', data);
          return data;
        }
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(isEditing ? 'Course updated successfully' : 'Course created successfully');
      navigate(`/admin/courses/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Error saving course:', error);
      toast.error(`Failed to save course: ${error?.message || 'Unknown error'}`);
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    console.log('Form submitted with values:', values);
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

  if (verifiedAdmin === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  if (verifiedAdmin === false) {
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
          className="inline-flex items-center gap-2 bg-discord-brand text-white hover:bg-discord-brand/90"
        >
          <Save className="h-4 w-4" />
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
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-discord-header-text">Course Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Introduction to Discord Bots"
                            {...field}
                            className="bg-discord-sidebar-bg border-discord-sidebar-bg/50 text-discord-text"
                            onBlur={() => {
                              if (!form.getValues('slug')) {
                                generateSlug();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-discord-header-text">URL Slug</FormLabel>
                          <button
                            type="button"
                            onClick={generateSlug}
                            className="text-sm text-discord-brand hover:underline"
                          >
                            Generate from title
                          </button>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="discord-bots-101"
                            {...field}
                            className="bg-discord-sidebar-bg border-discord-sidebar-bg/50 text-discord-text"
                          />
                        </FormControl>
                        <p className="mt-1 text-xs text-discord-secondary-text">
                          This will be used in the URL: /courses/{form.watch('slug') || 'example-slug'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-discord-header-text">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Learn how to build powerful Discord bots from scratch..."
                            {...field}
                            className="min-h-32 bg-discord-sidebar-bg border-discord-sidebar-bg/50 text-discord-text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumbnail_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-discord-header-text">Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                            className="bg-discord-sidebar-bg border-discord-sidebar-bg/50 text-discord-text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
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
              <div className="flex flex-col items-center justify-center space-y-4">
                {form.watch('thumbnail_url') ? (
                  <div className="relative">
                    <img
                      src={form.watch('thumbnail_url')}
                      alt="Course thumbnail"
                      className="h-48 w-full rounded-md object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => form.setValue('thumbnail_url', '')}
                      className="absolute right-2 top-2 rounded-full bg-discord-deep-bg p-1 text-discord-secondary-text hover:text-discord-brand"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center rounded-md bg-discord-sidebar-bg">
                    <Image className="mb-2 h-10 w-10 text-discord-secondary-text" />
                    <p className="text-discord-secondary-text">No thumbnail set</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
              <CardHeader>
                <CardTitle className="text-discord-header-text">Modules</CardTitle>
                <CardDescription className="text-discord-secondary-text">
                  Course content organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <p className="text-center text-discord-secondary-text">
                    Add and manage modules for this course
                  </p>
                  <Button
                    onClick={() => navigate(`/admin/courses/${courseId}/modules/new`)}
                    className="w-full bg-discord-brand text-white hover:bg-discord-brand/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCourseEditPage;
