
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
  },
  
  /**
   * Creates a comprehensive test course with multiple modules and varied lesson types
   * for thorough system testing
   */
  createComprehensiveTestCourse: async () => {
    // Log the current user for debugging purposes
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Creating comprehensive test course with user:", {
      userId: user?.id,
      userMetadata: user?.user_metadata
    });
    
    // Check if advanced test course already exists
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id, slug')
      .eq('slug', 'advanced-test-course')
      .limit(1);

    if (existingCourses && existingCourses.length > 0) {
      console.log("Advanced test course already exists, returning existing course");
      return { data: existingCourses[0], error: null };
    }

    // Verify admin status
    if (!user) {
      console.error("No user found when trying to create comprehensive test course");
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
    
    console.log("Admin check for advanced test course creation:", {
      isAdmin,
      userId: extendedUser.id,
      discordId
    });
    
    if (!isAdmin) {
      console.error("User is not an admin. User ID:", extendedUser.id);
      return { data: null, error: new Error('Only admin users can create courses') };
    }

    // Create advanced test course with different content setup than the basic test course
    const courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
      title: "Advanced Test Course",
      slug: "advanced-test-course",
      description: "This is a comprehensive test course with multiple modules and various lesson types to thoroughly test the platform functionality.",
      thumbnail_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
    };

    // Create the course using RPC function
    const { data: courseId, error: courseError } = await supabase
      .rpc('create_course', {
        course_title: courseData.title,
        course_slug: courseData.slug,
        course_description: courseData.description,
        course_thumbnail_url: courseData.thumbnail_url
      });

    if (courseError || !courseId) {
      console.error("Failed to create advanced test course:", courseError);
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

    // Create diverse modules for the course
    const modulePromises = [
      // Module 1: Introduction with mixed content
      createTestModule(course.id, 0, "Introduction", "introduction", [
        {
          title: "Welcome & Overview",
          slug: "welcome-overview",
          mediaType: "video",
          mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          content: "# Welcome to the Advanced Test Course\n\nThis is a comprehensive course designed to test all aspects of the learning platform. In this welcome video, we provide an overview of what you'll learn.",
          orderIndex: 0
        },
        {
          title: "Course Structure",
          slug: "course-structure",
          mediaType: "text",
          mediaUrl: "",
          content: "# Course Structure\n\nThis course is structured to test different aspects of the learning platform:\n\n- **Introduction**: Get familiar with the platform\n- **Text Content**: Test markdown rendering\n- **Media Content**: Test video and audio playback\n- **Interactive Content**: Test interactive elements\n- **Assessment**: Test quiz and assessment functionality\n\nEach module builds on the previous one and includes different types of lessons.",
          orderIndex: 1
        },
        {
          title: "Getting Started Guide",
          slug: "getting-started",
          mediaType: "audio",
          mediaUrl: "https://www.w3schools.com/html/horse.mp3",
          content: "# Getting Started Audio Guide\n\nListen to this audio guide for tips on how to get the most out of this course.",
          orderIndex: 2
        }
      ]),
      
      // Module 2: Text-heavy content for Markdown testing
      createTestModule(course.id, 1, "Text Content", "text-content", [
        {
          title: "Basic Markdown",
          slug: "basic-markdown",
          mediaType: "text",
          mediaUrl: "",
          content: "# Basic Markdown Formatting\n\nThis lesson demonstrates basic markdown formatting:\n\n## Headers\n\nHeaders of different levels (H1 through H6)\n\n### Lists\n\n- Unordered list item 1\n- Unordered list item 2\n  - Nested item\n  - Another nested item\n\n1. Ordered list item 1\n2. Ordered list item 2\n\n### Emphasis\n\n*Italic text*\n\n**Bold text**\n\n***Bold and italic text***\n\n### Links\n\n[Example Link](https://example.com)\n\n### Code\n\nInline `code` example\n\n```javascript\n// Code block\nfunction example() {\n  console.log('This is a code block');\n}\n```",
          orderIndex: 0
        },
        {
          title: "Advanced Markdown",
          slug: "advanced-markdown",
          mediaType: "text",
          mediaUrl: "",
          content: "# Advanced Markdown Features\n\n## Tables\n\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n## Blockquotes\n\n> This is a blockquote.\n> \n> It can span multiple lines.\n\n## Horizontal Rules\n\n---\n\n## Images\n\n![Alt text](https://via.placeholder.com/150)\n\n## Task Lists\n\n- [x] Completed task\n- [ ] Incomplete task\n- [ ] Another task\n\n## Footnotes\n\nHere's a simple footnote[^1].\n\n[^1]: This is the footnote content.",
          orderIndex: 1
        },
        {
          title: "Documentation Example",
          slug: "documentation-example",
          mediaType: "text",
          mediaUrl: "",
          content: "# API Documentation Example\n\n## Getting Started\n\nThis page demonstrates how technical documentation might look in our platform.\n\n## Authentication\n\nAll API requests require authentication using a JWT token.\n\n```javascript\nconst response = await fetch('https://api.example.com/data', {\n  headers: {\n    'Authorization': `Bearer ${token}`\n  }\n});\n```\n\n## Endpoints\n\n### GET /users\n\nReturns a list of all users.\n\n**Response Format:**\n\n```json\n{\n  \"users\": [\n    {\n      \"id\": 1,\n      \"name\": \"John Doe\",\n      \"email\": \"john@example.com\"\n    },\n    {\n      \"id\": 2,\n      \"name\": \"Jane Smith\",\n      \"email\": \"jane@example.com\"\n    }\n  ]\n}\n```\n\n### POST /users\n\nCreates a new user.\n\n**Request Format:**\n\n```json\n{\n  \"name\": \"New User\",\n  \"email\": \"user@example.com\",\n  \"password\": \"securepassword\"\n}\n```\n\n**Response Format:**\n\n```json\n{\n  \"id\": 3,\n  \"name\": \"New User\",\n  \"email\": \"user@example.com\"\n}\n```",
          orderIndex: 2
        },
        {
          title: "Long-Form Content",
          slug: "long-form-content",
          mediaType: "text",
          mediaUrl: "",
          content: "# Deep Dive Technical Article\n\n## Introduction\n\nThis lesson simulates a long-form technical article to test scrolling behavior and layout of extended content.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\n## Section 1: Technical Background\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\n## Section 2: Implementation Details\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\n```python\ndef example_function():\n    \"\"\"This is a sample Python function\"\"\"\n    data = []\n    for i in range(10):\n        data.append(i * i)\n    return data\n\nresult = example_function()\nprint(f\"The result is: {result}\")\n```\n\n## Section 3: Advanced Concepts\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\n## Section 4: Case Studies\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\n## Conclusion\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.",
          orderIndex: 3
        }
      ]),
      
      // Module 3: Video content testing
      createTestModule(course.id, 2, "Video Content", "video-content", [
        {
          title: "Video with Transcript",
          slug: "video-with-transcript",
          mediaType: "video",
          mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          content: "# Video with Transcript\n\nThis lesson demonstrates a video with an accompanying transcript for accessibility.",
          transcript: "This is a sample transcript for the video content. In an actual implementation, this would contain the full text transcript of the video to improve accessibility and allow users to review content in text form. Transcripts are essential for accessibility and also help with content comprehension and searchability.",
          orderIndex: 0
        },
        {
          title: "Multiple Video Formats",
          slug: "multiple-video-formats",
          mediaType: "video",
          mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          content: "# Multiple Video Format Support\n\nThis lesson tests support for different video formats and sources.",
          orderIndex: 1
        },
        {
          title: "Video with Supplementary Content",
          slug: "video-supplementary",
          mediaType: "video",
          mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          content: "# Video with Supplementary Content\n\nThis video lesson includes supplementary text content and resources.\n\n## Additional Resources\n\n- [Resource 1](https://example.com/resource1)\n- [Resource 2](https://example.com/resource2)\n- [Resource 3](https://example.com/resource3)\n\n## Key Concepts\n\n1. Concept A: Description of concept A\n2. Concept B: Description of concept B\n3. Concept C: Description of concept C",
          orderIndex: 2
        }
      ]),
      
      // Module 4: Audio content testing
      createTestModule(course.id, 3, "Audio Content", "audio-content", [
        {
          title: "Audio Lecture",
          slug: "audio-lecture",
          mediaType: "audio",
          mediaUrl: "https://www.w3schools.com/html/horse.mp3",
          content: "# Audio Lecture\n\nThis lesson provides an audio lecture with accompanying notes.",
          transcript: "This is a sample transcript for the audio lecture. In a real implementation, this would contain the full text of the audio content to improve accessibility and allow users to review the material in text form.",
          orderIndex: 0
        },
        {
          title: "Podcast Discussion",
          slug: "podcast-discussion",
          mediaType: "audio",
          mediaUrl: "https://www.w3schools.com/html/horse.mp3",
          content: "# Podcast-Style Discussion\n\nThis lesson presents a podcast-style discussion between experts on the topic.\n\n## Discussion Topics\n\n1. Topic A: Background and concepts\n2. Topic B: Implementation strategies\n3. Topic C: Future developments\n\n## Participants\n\n- Expert 1: Specialization in Topic A\n- Expert 2: Specialization in Topic B\n- Moderator: Guides the discussion",
          orderIndex: 1
        },
        {
          title: "Audio Tutorial with Exercise",
          slug: "audio-tutorial",
          mediaType: "audio",
          mediaUrl: "https://www.w3schools.com/html/horse.mp3",
          content: "# Audio Tutorial with Exercise\n\nThis lesson combines an audio tutorial with practical exercises to complete.\n\n## Exercise Instructions\n\n1. Listen to the full audio tutorial\n2. Complete the following tasks:\n   - Task 1: Description of task 1\n   - Task 2: Description of task 2\n   - Task 3: Description of task 3\n3. Review the solution in the transcript\n\n## Solution Overview\n\nThe solution approach should focus on applying the concepts from the audio tutorial to solve the given tasks efficiently.",
          orderIndex: 2
        }
      ]),
      
      // Module 5: Mixed content module
      createTestModule(course.id, 4, "Mixed Content", "mixed-content", [
        {
          title: "Theory and Demonstration",
          slug: "theory-demonstration",
          mediaType: "text",
          mediaUrl: "",
          content: "# Theory and Concept Overview\n\nThis text-based lesson introduces the theoretical concepts before the video demonstration in the next lesson.\n\n## Key Theoretical Concepts\n\n1. Concept A: Detailed explanation of concept A with examples\n2. Concept B: Detailed explanation of concept B with examples\n3. Concept C: Detailed explanation of concept C with examples\n\n## Preparation for Demonstration\n\nBefore watching the demonstration video in the next lesson, make sure you understand these concepts thoroughly as they form the foundation of the practical implementation.",
          orderIndex: 0
        },
        {
          title: "Video Demonstration",
          slug: "video-demo",
          mediaType: "video",
          mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          content: "# Practical Demonstration\n\nThis video demonstrates the practical application of the concepts introduced in the previous text-based lesson.",
          orderIndex: 1
        },
        {
          title: "Discussion and Analysis",
          slug: "discussion-analysis",
          mediaType: "audio",
          mediaUrl: "https://www.w3schools.com/html/horse.mp3",
          content: "# Discussion and Analysis\n\nThis audio lesson provides expert discussion and analysis of the concepts and demonstration from the previous lessons.\n\n## Discussion Points\n\n1. Analysis of implementation approaches\n2. Common challenges and solutions\n3. Best practices and optimization techniques",
          orderIndex: 2
        },
        {
          title: "Practical Exercise",
          slug: "practical-exercise",
          mediaType: "text",
          mediaUrl: "",
          content: "# Practical Exercise\n\nNow that you've learned the theory, seen the demonstration, and heard expert analysis, it's time to apply your knowledge in a practical exercise.\n\n## Exercise Requirements\n\n1. Requirement 1: Description of what needs to be accomplished\n2. Requirement 2: Description of what needs to be accomplished\n3. Requirement 3: Description of what needs to be accomplished\n\n## Submission Guidelines\n\nWhen completing this exercise, make sure to:\n\n- Follow the patterns demonstrated in the video\n- Apply the optimization techniques discussed in the audio lesson\n- Document your approach and any challenges faced\n\n## Sample Solution\n\n```javascript\n// This is a simplified example solution\nfunction exerciseSolution() {\n  // Implementation details would go here\n  console.log('Exercise completed successfully!');\n}\n```",
          orderIndex: 3
        },
        {
          title: "Additional Resources",
          slug: "additional-resources",
          mediaType: "text",
          mediaUrl: "",
          content: "# Additional Resources and Further Reading\n\nThis lesson provides supplementary resources to deepen your understanding of the topics covered in this module.\n\n## Recommended Reading\n\n- Book 1: Title and description\n- Book 2: Title and description\n- Book 3: Title and description\n\n## Online Resources\n\n- [Resource 1](https://example.com/resource1): Description of resource\n- [Resource 2](https://example.com/resource2): Description of resource\n- [Resource 3](https://example.com/resource3): Description of resource\n\n## Community Forums\n\n- [Forum 1](https://example.com/forum1): Description of forum\n- [Forum 2](https://example.com/forum2): Description of forum\n\n## Next Steps\n\nAfter completing this module, you may want to explore these related topics:\n\n1. Related Topic 1: Brief description\n2. Related Topic 2: Brief description\n3. Related Topic 3: Brief description",
          orderIndex: 4
        }
      ])
    ];

    await Promise.all(modulePromises);
    console.log("Advanced test course created successfully:", course);
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
 * Helper function to create a test module with specified lessons
 */
async function createTestModule(
  courseId: string, 
  orderIndex: number, 
  title: string, 
  slug: string, 
  lessons: Array<{
    title: string;
    slug: string;
    mediaType: 'text' | 'video' | 'audio';
    mediaUrl: string;
    content: string;
    transcript?: string;
    orderIndex: number;
  }>
) {
  try {
    // Create module
    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title,
        slug,
        order_index: orderIndex,
        discord_thread_url: `https://discord.com/channels/123456789/${slug}`
      })
      .select()
      .single();

    if (error || !module) {
      console.error(`Failed to create test module "${title}":`, error);
      return;
    }

    // Create all lessons for this module
    const lessonPromises = lessons.map(lesson => {
      return createLesson(
        module.id, 
        lesson.orderIndex, 
        lesson.title, 
        lesson.slug, 
        lesson.mediaType, 
        lesson.mediaUrl,
        lesson.content,
        lesson.transcript
      );
    });
    
    await Promise.all(lessonPromises);
    console.log(`Created test module "${title}" with ${lessons.length} lessons`);
    return module;
  } catch (error) {
    console.error(`Error creating test module "${title}":`, error);
  }
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

