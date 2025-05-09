
import { supabase } from '../client';
import type { Course } from '../types';

/**
 * Get all courses accessible to a user, based on their roles.
 * @param userId - The ID of the user.
 * @returns An object containing an array of courses or an error.
 */
const getAccessibleCourses = async (userId: string) => {
  try {
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    if (!userRoles || userRoles.length === 0) {
      // If the user has no specific roles, return all courses with no role restrictions
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .is('allowed_roles', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    }

    // Get the IDs of the roles the user has
    const roleIds = userRoles.map(role => role.role_id);

    // Fetch courses that either have no role restrictions or are allowed for the user's roles
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .or(`allowed_roles.is.null,allowed_roles.cs.{${roleIds.join(',')}}`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data, error: null };
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
