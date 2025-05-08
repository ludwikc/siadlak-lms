
import { supabase } from '../client';
import { courseService } from './course.service';
import type { Course, Module, Lesson } from '../types';

/**
 * Service to seed test data into the database
 */
export const seedService = {
  /**
   * Creates a dummy course with modules and lessons for testing
   */
  createDummyCourse: async () => {
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

    // Create new dummy course
    const courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
      title: "Test Course",
      slug: "test-course",
      description: "This is a dummy course created for testing purposes. It includes sample modules and lessons with different content types.",
      thumbnail_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"
    };

    const { data: course, error } = await courseService.createCourse(courseData);

    if (error || !course) {
      console.error("Failed to create dummy course:", error);
      return { data: null, error };
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
