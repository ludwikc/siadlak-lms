import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';

export const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

type Props = {
  form: UseFormReturn<CourseFormValues>;
  onSubmit: (values: CourseFormValues) => void;
  generateSlug: () => void;
};

const CourseEditForm: React.FC<Props> = ({ form, onSubmit, generateSlug }) => (
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
    </form>
  </Form>
);

export { CourseEditForm };
