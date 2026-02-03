
import { supabase } from '../client';
import type { Course } from '../types';

/**
 * Get all courses accessible to a user, based on their roles.
 * @param userId - The ID of the user.
 * @param isAdmin - Whether the user is an admin.
 * @returns An object containing an array of courses or an error.
 */
const getAccessibleCourses = async (userId: string, isAdmin = false) => {
  try {
    // If user is admin, return all courses (no role restrictions)
    if (isAdmin) {
      console.log('User is admin, fetching all courses');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    }

    // Fetch user's Discord role IDs and all course-role mappings in parallel
    const [userRolesResult, courseRolesResult, allCoursesResult] = await Promise.all([
      supabase.from('user_roles').select('discord_role_id').eq('user_id', userId),
      supabase.from('course_roles').select('course_id, discord_role_id'),
      supabase.from('courses').select('*').order('created_at', { ascending: true }),
    ]);

    if (userRolesResult.error) throw userRolesResult.error;
    if (courseRolesResult.error) throw courseRolesResult.error;
    if (allCoursesResult.error) throw allCoursesResult.error;

    const userRoleIds = (userRolesResult.data || []).map(r => r.discord_role_id);
    const allCourseRoles = courseRolesResult.data || [];
    const allCourses = allCoursesResult.data || [];

    // Courses that have any role restriction defined
    const restrictedCourseIds = new Set(allCourseRoles.map(cr => cr.course_id));

    // Courses the user can access via their roles
    const accessibleCourseIds = new Set(
      allCourseRoles
        .filter(cr => userRoleIds.includes(cr.discord_role_id))
        .map(cr => cr.course_id)
    );

    console.log('User roles:', userRoleIds);
    console.log('Restricted courses:', [...restrictedCourseIds]);
    console.log('Accessible via roles:', [...accessibleCourseIds]);

    // A course is visible if it has no role restrictions OR if the user has a matching role
    const filteredCourses = allCourses.filter(course =>
      !restrictedCourseIds.has(course.id) || accessibleCourseIds.has(course.id)
    );

    return { data: filteredCourses, error: null };
  } catch (error) {
    console.error('Error fetching accessible courses:', error);
    return { data: null, error };
  }
};

/**
 * Get a course by its ID.
 * @param id - The ID of the course to retrieve.
 * @returns An object containing the course data or an error.
 */
const getCourseById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    return { data: null, error };
  }
};

/**
 * Get a course by its slug.
 * @param slug - The slug of the course to retrieve.
 * @returns An object containing the course data or an error.
 */
const getCourseBySlug = async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course by slug:', error);
    return { data: null, error };
  }
};

/**
 * Get all courses, regardless of user access
 */
const getAllCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return { data: null, error };
  }
};

/**
 * Create a new course
 * @param courseData - The course data to create
 * @returns An object containing the created course data or an error
 */
const createCourse = async (courseData: Partial<Course>) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating course:', error);
    return { data: null, error };
  }
};

/**
 * Update an existing course
 * @param id - The ID of the course to update
 * @param courseData - The course data to update
 * @returns An object containing the updated course data or an error
 */
const updateCourse = async (id: string, courseData: Partial<Course>) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating course:', error);
    return { data: null, error };
  }
};

export const courseService = {
  getAccessibleCourses,
  getCourseById,
  getCourseBySlug,
  getAllCourses,
  createCourse,
  updateCourse,
};
