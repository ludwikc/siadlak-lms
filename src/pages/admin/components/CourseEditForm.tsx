
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { courseService } from '@/lib/supabase/services';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

// Schema definition
const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseEditFormProps {
  courseId?: string;
}

export const CourseEditForm: React.FC<CourseEditFormProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize form with react-hook-form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      thumbnail_url: '',
    },
  });

  // Function to generate slug from title
  const generateSlug = () => {
    const title = form.getValues('title');
    if (title) {
      form.setValue('slug', slugify(title));
    }
  };

  // Load course data if editing
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await courseService.getCourseById(courseId);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Populate form with course data
          form.reset({
            title: data.title || '',
            slug: data.slug || '',
            description: data.description || '',
            thumbnail_url: data.thumbnail_url || '',
          });
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourseData();
  }, [courseId, form]);

  // Handle form submission
  const onSubmit = async (values: CourseFormValues) => {
    setIsLoading(true);
    
    try {
      if (courseId) {
        // Update existing course
        const { data, error } = await courseService.updateCourse(courseId, values);
        
        if (error) throw error;
        
        toast.success('Course updated successfully');
      } else {
        // Create new course
        const { data, error } = await courseService.createCourse(values);
        
        if (error) throw error;
        
        toast.success('Course created successfully');
        
        // Navigate to edit page for the new course
        if (data?.id) {
          navigate(`/admin/courses/${data.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(`Failed to ${courseId ? 'update' : 'create'} course`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
      <CardHeader>
        <CardTitle className="text-discord-header-text">{courseId ? 'Edit' : 'Create'} Course</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
            autoComplete="off"
          >
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

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-discord-brand hover:bg-discord-brand-hover text-white"
              >
                {isLoading ? 'Saving...' : courseId ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Add a utility function to generate slugs if not available in utils
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}
