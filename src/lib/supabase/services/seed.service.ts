
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

    // Create modules for the course with distinct purposes
    const modulePromises = [
      createModule(course.id, 0, "Getting Started", "getting-started"),
      createModule(course.id, 1, "Core Concepts", "core-concepts"),
      createModule(course.id, 2, "Advanced Topics", "advanced-topics"),
      createModule(course.id, 3, "Practical Applications", "practical-applications")
    ];

    await Promise.all(modulePromises);
    console.log("Dummy course created successfully:", course);
    return { data: course, error: null };
  }
};

/**
 * Helper to create a module with lessons of different types
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

  // Create different lesson types for each module
  const lessonPromises = [];
  
  // Vary lessons based on module type
  switch(orderIndex) {
    case 0: // Getting Started - text heavy
      lessonPromises.push(
        createLesson(module.id, 0, "Welcome to the Course", "welcome", "text", "", 
          `# Welcome to the Course\n\nThis is the introduction to our course. Here we'll cover:\n\n- Course objectives\n- How to use the platform\n- What you'll learn\n\n## Getting Help\n\nIf you need assistance, join our Discord community.`),
        createLesson(module.id, 1, "Course Structure", "course-structure", "text", "",
          `# Course Structure\n\nThis course is divided into four modules:\n\n1. **Getting Started** - Fundamentals and setup\n2. **Core Concepts** - Essential knowledge\n3. **Advanced Topics** - Deep dives and expert techniques\n4. **Practical Applications** - Real-world projects\n\nComplete each module before moving to the next.`),
        createLesson(module.id, 2, "Introduction Video", "intro-video", "video", "https://www.w3schools.com/html/mov_bbb.mp4",
          `# Introduction Video\n\nWatch this orientation video to get familiar with the course structure.`)
      );
      break;
      
    case 1: // Core Concepts - mixed content
      lessonPromises.push(
        createLesson(module.id, 0, "Fundamental Principles", "fundamental-principles", "text", "",
          `# Fundamental Principles\n\n## Key Concepts\n\nIn this lesson, we cover the foundational principles:\n\n- Concept A: Description and importance\n- Concept B: Real-world applications\n- Concept C: How it connects to other concepts\n\n## Code Example\n\n\`\`\`javascript\nfunction example() {\n  console.log("This demonstrates concept A");\n  return true;\n}\n\`\`\``),
        createLesson(module.id, 1, "Demonstration Video", "demo-video", "video", "https://www.w3schools.com/html/mov_bbb.mp4",
          `# Video Demonstration\n\nThis video walks through the practical application of the core concepts.`),
        createLesson(module.id, 2, "Case Study Analysis", "case-study", "text", "",
          `# Case Study: Real-World Implementation\n\n## Background\n\nThis case study examines how Company X implemented these concepts to solve a significant business challenge.\n\n## Challenge\n\nThe company faced issues with their existing system that was causing delays and errors.\n\n## Solution\n\nBy applying concepts from this module, they developed a more efficient approach.`)
      );
      break;
      
    case 2: // Advanced Topics - technical focus
      lessonPromises.push(
        createLesson(module.id, 0, "Advanced Techniques", "advanced-techniques", "text", "",
          `# Advanced Techniques\n\n## Going Beyond the Basics\n\nIn this lesson, we explore more sophisticated approaches to problem-solving:\n\n- Technique X: When and how to apply it\n- Technique Y: Optimizing for performance\n- Technique Z: Handling edge cases\n\n## Code Example\n\n\`\`\`javascript\nclass AdvancedSolution {\n  constructor() {\n    this.config = { optimized: true };\n  }\n  \n  processData(input) {\n    // Implementation details\n    return transformedData;\n  }\n}\n\`\`\``),
        createLesson(module.id, 1, "Expert Interview", "expert-interview", "audio", "https://www.w3schools.com/html/horse.mp3",
          `# Expert Interview\n\nListen to our interview with industry expert Jane Doe about implementing advanced techniques in large-scale systems.`),
        createLesson(module.id, 2, "Deep Dive Workshop", "deep-dive", "video", "https://www.w3schools.com/html/mov_bbb.mp4",
          `# Technical Deep Dive\n\nThis workshop session explores the internal workings and optimization strategies for complex implementations.`)
      );
      break;
      
    case 3: // Practical Applications - project focused
      lessonPromises.push(
        createLesson(module.id, 0, "Project Overview", "project-overview", "text", "",
          `# Final Project Overview\n\n## Project Requirements\n\nYour final project will demonstrate mastery of the concepts covered in this course:\n\n- Implement features A, B, and C\n- Apply optimization techniques\n- Document your approach and decisions\n\n## Evaluation Criteria\n\nProjects will be evaluated based on:\n1. Functionality\n2. Code quality\n3. Documentation\n4. Innovation`),
        createLesson(module.id, 1, "Implementation Guide", "implementation-guide", "video", "https://www.w3schools.com/html/mov_bbb.mp4",
          `# Implementation Walkthrough\n\nThis video provides a step-by-step guide to completing the final project.`),
        createLesson(module.id, 2, "Q&A Session", "qa-session", "audio", "https://www.w3schools.com/html/horse.mp3",
          `# Project Q&A Session\n\nCommon questions and answers about the final project implementation.`),
        createLesson(module.id, 3, "Submission Guidelines", "submission", "text", "",
          `# Project Submission\n\n## Submission Process\n\n1. Complete all project requirements\n2. Test your implementation\n3. Create documentation\n4. Submit through the course portal by the deadline\n\n## After Submission\n\nYou'll receive feedback within 7 days of submission.`)
      );
      break;
  }
  
  await Promise.all(lessonPromises);
}

/**
 * Helper to create a lesson with specific content and media type
 */
async function createLesson(
  moduleId: string, 
  orderIndex: number, 
  title: string, 
  slug: string, 
  mediaType: 'text' | 'video' | 'audio', 
  mediaUrl: string,
  content: string,
  transcript?: string
) {
  return supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      slug,
      content,
      media_type: mediaType,
      media_url: mediaUrl,
      order_index: orderIndex,
      transcript: mediaType !== 'text' ? (transcript || 'This is a sample transcript for the media content.') : null
    });
}
