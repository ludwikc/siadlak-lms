
import { supabase } from '../client';
import { courseService } from './course.service';
import type { Course, Module, Lesson } from '../types';
import { ExtendedUser, ADMIN_DISCORD_IDS } from '@/types/auth';

/**
 * Service to seed test data into the database
 */
export const seedService = {
  /**
   * Creates a dummy course with modules and lessons for testing
   */
  createDummyCourse: async () => {
    // Log the current user for debugging purposes
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Creating dummy course with user:", {
      userId: user?.id,
      userMetadata: user?.user_metadata,
      providerData: user?.identities?.[0]?.provider,
      providerId: user?.user_metadata?.provider_id
    });
    
    // Check if dummy course already exists
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id, slug')
      .eq('slug', 'test-course')
      .limit(1);

    if (existingCourses && existingCourses.length > 0) {
      console.log("Dummy course already exists, returning existing course");
      return { data: existingCourses[0], error: null };
    }

    // Check if user is admin before proceeding
    if (!user) {
      console.error("No user found when trying to create dummy course");
      return { data: null, error: new Error('User not authenticated') };
    }

    // Cast user to ExtendedUser type for TypeScript
    const extendedUser = user as ExtendedUser;
    
    // Get discord ID from various possible locations
    const discordId = extendedUser.discord_id || 
                    extendedUser.user_metadata?.discord_id || 
                    extendedUser.user_metadata?.provider_id || 
                    '';
    
    // Check admin status from all possible sources
    const isAdmin = !!extendedUser.is_admin || 
                  !!extendedUser.user_metadata?.is_admin ||
                  (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
                  (extendedUser.id && ADMIN_DISCORD_IDS.includes(extendedUser.id));
    
    console.log("Admin check for dummy course creation:", {
      isAdmin,
      userId: extendedUser.id,
      discordId,
      userIsAdmin: extendedUser.is_admin,
      metadataIsAdmin: extendedUser.user_metadata?.is_admin,
      exactIdMatch: extendedUser.id === 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'
    });
    
    // If not admin, return error
    if (!isAdmin) {
      console.error("User is not an admin. User ID:", extendedUser.id);
      return { data: null, error: new Error('Only admin users can create courses') };
    }

    // Create new dummy course
    const courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
      title: "Test Course",
      slug: "test-course",
      description: "This is a dummy course created for testing purposes. It includes sample modules and lessons with different content types.",
      thumbnail_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"
    };

    // Use direct RPC call instead of going through the service layer
    // This bypasses our service layer's additional checks which might be causing issues
    const { data: courseId, error: courseError } = await supabase
      .rpc('create_course', {
        course_title: courseData.title,
        course_slug: courseData.slug,
        course_description: courseData.description,
        course_thumbnail_url: courseData.thumbnail_url
      });

    if (courseError || !courseId) {
      console.error("Failed to create dummy course:", courseError);
      return { data: null, error: courseError };
    }

    // Get the newly created course
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (!course) {
      console.error("Failed to retrieve created course");
      return { data: null, error: new Error('Failed to retrieve created course') };
    }

    // Create modules for the course
    const modulePromises = [
      createModule(course.id, 0, "Getting Started", "getting-started"),
      createModule(course.id, 1, "Core Concepts", "core-concepts"),
      createModule(course.id, 2, "Advanced Topics", "advanced-topics")
    ];

    await Promise.all(modulePromises);
    console.log("Dummy course created successfully:", course);
    return { data: course, error: null };
  }
};

/**
 * Helper to create a module with lessons
 */
async function createModule(courseId: string, orderIndex: number, title: string, slug: string) {
  // Create module
  const { data: module, error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      slug,
      order_index: orderIndex,
      discord_thread_url: `https://discord.com/channels/123456789/module-${orderIndex}`
    })
    .select()
    .single();

  if (error || !module) {
    console.error(`Failed to create module "${title}":`, error);
    return;
  }

  // Create lessons for this module
  const lessonTypes = ['text', 'video', 'audio'];
  
  for (let i = 0; i < 3; i++) {
    const mediaType = lessonTypes[i % 3];
    
    let mediaUrl = '';
    let content = '';
    
    switch (mediaType) {
      case 'video':
        mediaUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
        content = "# Video Lesson\n\nThis is a sample video lesson. Below you'll find the embedded video player.\n\nAfter watching the video, try to answer the questions in the discussion thread.";
        break;
      case 'audio':
        mediaUrl = 'https://www.w3schools.com/html/horse.mp3';
        content = "# Audio Lesson\n\nThis is a sample audio lesson. Listen to the audio track below.\n\nPractice the concepts discussed in this audio lesson.";
        break;
      case 'text':
        mediaUrl = '';
        content = `# Text Lesson ${i + 1}

This is a sample text lesson with markdown content.

## Key Points

- Point 1: Lorem ipsum dolor sit amet
- Point 2: Consectetur adipiscing elit
- Point 3: Sed do eiusmod tempor incididunt

## Code Example

\`\`\`javascript
function example() {
  console.log("This is a code example");
  return "Hello world!";
}
\`\`\`

## Summary

This lesson covered the basics of this topic. In the next lesson, we'll explore more advanced concepts.`;
        break;
    }
    
    await supabase
      .from('lessons')
      .insert({
        module_id: module.id,
        title: `Lesson ${i + 1}: ${title} ${mediaType === 'text' ? 'Fundamentals' : mediaType === 'video' ? 'Demonstration' : 'Discussion'}`,
        slug: `${slug}-lesson-${i + 1}`,
        content,
        media_type: mediaType,
        media_url: mediaUrl,
        order_index: i,
        transcript: mediaType !== 'text' ? 'This is a sample transcript for the media content.' : null
      });
  }
}
