# Access Control & Database Schema - Implementation Plan

**Project:** Siadlak LMS
**Date:** 2026-01-31
**Status:** Planning Phase
**Priority:** High - Foundation for future development

---

## Executive Summary

The current access control system works due to Supabase RLS policies, but the application-level code is broken and unsynchronized. This plan provides a comprehensive roadmap to:

1. Fix broken application code
2. Synchronize TypeScript types with database schema (20 tables)
3. Establish clear access control architecture
4. Create maintainable patterns for future development

---

## Current State Analysis

### ✅ What Works
- **RLS Policies** enforce access control at database level
- **Discord OAuth** integration for authentication
- **Admin Panel** (`RoleAccessManager.tsx`) manages role-to-course mappings
- **User experience** - students see correct courses

### ❌ What's Broken
1. **TypeScript types out of sync** - 10 missing tables
2. **`course.service.ts`** references non-existent database fields:
   - Line 29: `role_id` (should be `discord_role_id`)
   - Line 40: `allowed_roles` (field doesn't exist)
   - Line 56: `allowed_roles` (field doesn't exist)
3. **Unclear table purposes** - `guild_roles` vs `course_roles` confusion
4. **No documentation** of RLS policies in codebase
5. **Inconsistent field naming** between tables

### ⚠️ Technical Debt
- Application code conflicts with database reality
- RLS policies not versioned or documented
- No migration strategy for schema changes
- Missing database constraints documentation

---

## Phase 1: TypeScript Types Synchronization

**Priority:** Critical
**Estimated Time:** 1-2 hours
**Dependencies:** None

### Tasks

#### 1.1 Regenerate TypeScript Types
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref taswmdahpcubiyrgsjki

# Generate types for all 20 tables
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

**Expected Outcome:**
- All 20 tables have TypeScript definitions
- Views (like `v_course_progress`) are typed
- Enums are properly defined
- RPC functions have correct signatures

#### 1.2 Update Custom Type Definitions
**File:** `src/lib/supabase/types.ts`

Add missing types for:
- `badges`
- `cohort_members`
- `feature_requests`
- `feature_votes`
- `guild_roles` ⭐
- `lesson_events`
- `pending_users`
- `purchase_history`
- `resource_categories`
- `resource_grants`
- `role_assignment_audit`
- `xp_events`

**Example for `guild_roles`:**
```typescript
export type GuildRole = {
  id: string;
  discord_role_id: string;
  name: string;
  color: number;
  position: number;
  icon_url?: string;
  created_at: string;
  updated_at: string;
};
```

#### 1.3 Validation
- [ ] Run TypeScript compiler: `npm run build`
- [ ] Fix any type errors that emerge
- [ ] Ensure no `any` types are used for database queries

---

## Phase 2: Fix Access Control Code

**Priority:** Critical
**Estimated Time:** 3-4 hours
**Dependencies:** Phase 1

### Current Access Control Flow

```
User Login (Discord OAuth)
  ↓
handle_discord_login() RPC function
  ├─ Upserts user in `users` table
  ├─ Syncs roles to `user_roles` table
  └─ Returns user_id
  ↓
User object contains:
  - user.id (Supabase UUID)
  - user.discord_id (Discord snowflake)
  - user.roles[] (Discord role IDs from JWT)
  ↓
RLS Policies filter queries based on:
  - user_roles table (user_id → discord_role_id)
  - course_roles table (discord_role_id → course_id)
  ↓
User sees only authorized courses
```

### Tasks

#### 2.1 Fix `course.service.ts`

**File:** `src/lib/supabase/services/course.service.ts`

**Current Broken Code (Lines 11-66):**
```typescript
const getAccessibleCourses = async (userId: string, isAdmin = false) => {
  // ... broken logic referencing non-existent fields
}
```

**Proposed Fix - Option A: Use RLS Policies (Recommended)**
```typescript
const getAccessibleCourses = async (userId: string, isAdmin = false) => {
  try {
    // Simply query courses - RLS policies will filter automatically
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching accessible courses:', error);
    return { data: null, error };
  }
};
```

**Why Option A?**
- Simplest implementation
- Leverages existing RLS policies
- Reduces code duplication
- Single source of truth (database policies)

**Proposed Fix - Option B: Explicit Application-Level Filtering**
```typescript
const getAccessibleCourses = async (userId: string, isAdmin = false) => {
  try {
    // Admin sees all courses
    if (isAdmin) {
      console.log('User is admin, fetching all courses');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    }

    // Step 1: Get user's Discord role IDs from user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    // Step 2: If user has no roles, they see no courses (or implement default behavior)
    if (!userRoles || userRoles.length === 0) {
      console.log('User has no roles, no accessible courses');
      return { data: [], error: null };
    }

    // Step 3: Get course IDs from course_roles that match user's Discord roles
    const discordRoleIds = userRoles.map(r => r.discord_role_id);

    const { data: courseRoles, error: courseRolesError } = await supabase
      .from('course_roles')
      .select('course_id')
      .in('discord_role_id', discordRoleIds);

    if (courseRolesError) throw courseRolesError;

    // Step 4: If no course access, return empty
    if (!courseRoles || courseRoles.length === 0) {
      console.log('User roles do not grant access to any courses');
      return { data: [], error: null };
    }

    // Step 5: Fetch the actual courses
    const courseIds = [...new Set(courseRoles.map(cr => cr.course_id))]; // Deduplicate

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`User has access to ${data?.length || 0} courses`);
    return { data, error: null };

  } catch (error) {
    console.error('Error fetching accessible courses:', error);
    return { data: null, error };
  }
};
```

**Why Option B?**
- Explicit access control logic
- Easier to debug
- Can implement custom logic (e.g., public courses)
- Better error messages

**Recommendation:** Start with **Option A**, add **Option B** only if needed for custom logic.

#### 2.2 Add Course Access Check Helper

**File:** `src/lib/supabase/services/course.service.ts`

```typescript
/**
 * Check if a user has access to a specific course
 * @param userId - The user's UUID
 * @param courseId - The course UUID
 * @param isAdmin - Whether user is admin (bypasses checks)
 * @returns boolean indicating access
 */
const canAccessCourse = async (
  userId: string,
  courseId: string,
  isAdmin = false
): Promise<{ hasAccess: boolean; error: any }> => {
  try {
    // Admins can access all courses
    if (isAdmin) {
      return { hasAccess: true, error: null };
    }

    // Get user's Discord roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    if (!userRoles || userRoles.length === 0) {
      return { hasAccess: false, error: null };
    }

    // Check if any of user's roles grant access to this course
    const discordRoleIds = userRoles.map(r => r.discord_role_id);

    const { data: courseRoles, error: courseRolesError } = await supabase
      .from('course_roles')
      .select('id')
      .eq('course_id', courseId)
      .in('discord_role_id', discordRoleIds)
      .limit(1);

    if (courseRolesError) throw courseRolesError;

    return {
      hasAccess: courseRoles && courseRoles.length > 0,
      error: null
    };

  } catch (error) {
    console.error('Error checking course access:', error);
    return { hasAccess: false, error };
  }
};

// Add to exports
export const courseService = {
  // ... existing methods
  canAccessCourse,
};
```

#### 2.3 Create Access Control Service

**New File:** `src/lib/supabase/services/access-control.service.ts`

```typescript
import { supabase } from '../client';

/**
 * Centralized access control service
 * Handles all authorization logic for courses, modules, and lessons
 */
export const accessControlService = {

  /**
   * Get all courses accessible to a user
   */
  getUserCourses: async (userId: string, isAdmin = false) => {
    // Implementation from Option A or B above
  },

  /**
   * Check if user can access a specific course
   */
  canAccessCourse: async (userId: string, courseId: string, isAdmin = false) => {
    // Implementation from 2.2 above
  },

  /**
   * Get all Discord roles that grant access to a course
   */
  getCourseAuthorizedRoles: async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_roles')
      .select('discord_role_id')
      .eq('course_id', courseId);

    return { data: data?.map(r => r.discord_role_id) || [], error };
  },

  /**
   * Grant a role access to a course
   */
  grantCourseAccess: async (courseId: string, discordRoleId: string) => {
    const { data, error } = await supabase
      .from('course_roles')
      .insert({ course_id: courseId, discord_role_id: discordRoleId })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Revoke a role's access to a course
   */
  revokeCourseAccess: async (courseId: string, discordRoleId: string) => {
    const { error } = await supabase
      .from('course_roles')
      .delete()
      .eq('course_id', courseId)
      .eq('discord_role_id', discordRoleId);

    return { error };
  },

  /**
   * Sync user roles from Discord
   * Called after Discord OAuth login
   */
  syncUserRoles: async (userId: string, discordRoleIds: string[]) => {
    // Delete old roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert new roles
    if (discordRoleIds.length > 0) {
      const rolesToInsert = discordRoleIds.map(roleId => ({
        user_id: userId,
        discord_role_id: roleId
      }));

      const { data, error } = await supabase
        .from('user_roles')
        .insert(rolesToInsert)
        .select();

      return { data, error };
    }

    return { data: [], error: null };
  }
};
```

---

## Phase 3: Document & Implement RLS Policies

**Priority:** High
**Estimated Time:** 4-6 hours
**Dependencies:** Phase 1, Phase 2

### Tasks

#### 3.1 Export Current RLS Policies

Since RLS policies are managed through Supabase dashboard, document them:

**New File:** `supabase/migrations/20260131_document_rls_policies.sql`

```sql
-- =====================================================
-- RLS POLICIES DOCUMENTATION
-- =====================================================
-- This file documents the current RLS policies.
-- These may already exist on the Supabase instance.
-- Run this to recreate them if needed.

-- =====================================================
-- COURSES TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to courses"
ON courses
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Policy: Users can read courses they have role access to
CREATE POLICY "Users can read courses based on their roles"
ON courses
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cr.course_id
    FROM course_roles cr
    INNER JOIN user_roles ur ON cr.discord_role_id = ur.discord_role_id
    WHERE ur.user_id = auth.uid()
  )
);

-- =====================================================
-- MODULES TABLE
-- =====================================================

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to modules"
ON modules
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Policy: Users can read modules if they have access to the course
CREATE POLICY "Users can read modules based on course access"
ON modules
FOR SELECT
TO authenticated
USING (
  course_id IN (
    SELECT cr.course_id
    FROM course_roles cr
    INNER JOIN user_roles ur ON cr.discord_role_id = ur.discord_role_id
    WHERE ur.user_id = auth.uid()
  )
);

-- =====================================================
-- LESSONS TABLE
-- =====================================================

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to lessons"
ON lessons
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Policy: Users can read lessons if they have access to the course
CREATE POLICY "Users can read lessons based on course access"
ON lessons
FOR SELECT
TO authenticated
USING (
  module_id IN (
    SELECT m.id
    FROM modules m
    INNER JOIN course_roles cr ON m.course_id = cr.course_id
    INNER JOIN user_roles ur ON cr.discord_role_id = ur.discord_role_id
    WHERE ur.user_id = auth.uid()
  )
);

-- =====================================================
-- USER_PROGRESS TABLE
-- =====================================================

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own progress
CREATE POLICY "Users can manage their own progress"
ON user_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- USER_ROLES TABLE
-- =====================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own roles
CREATE POLICY "Users can read their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can manage all user roles
CREATE POLICY "Admins can manage user roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- =====================================================
-- COURSE_ROLES TABLE
-- =====================================================

ALTER TABLE course_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read course roles (for checking access)
CREATE POLICY "Authenticated users can read course roles"
ON course_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admins can manage course roles
CREATE POLICY "Admins can manage course roles"
ON course_roles
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- =====================================================
-- GUILD_ROLES TABLE (if it exists)
-- =====================================================

-- TODO: Define policies once we understand this table's purpose
```

#### 3.2 Verify RLS Policies

Create a test suite to verify RLS policies work:

**New File:** `supabase/tests/rls_policies.test.sql`

```sql
-- Test suite for RLS policies
-- Run these manually or with pgTAP

-- Test 1: Regular user cannot see courses without role access
-- Test 2: User can see courses they have role access to
-- Test 3: Admin can see all courses
-- Test 4: User can only update their own progress
-- etc.
```

#### 3.3 Add Policy Documentation to Codebase

Update `DATABASE_SCHEMA.md` with RLS policies section.

---

## Phase 4: Establish `guild_roles` Table Purpose

**Priority:** Medium
**Estimated Time:** 2-3 hours
**Dependencies:** Phase 1

### Investigation Tasks

#### 4.1 Examine Current Database State

```sql
-- Connect to Supabase and run:
SELECT * FROM guild_roles LIMIT 10;
DESCRIBE guild_roles; -- or \d guild_roles in psql
```

#### 4.2 Determine Table Purpose

**Hypothesis:** `guild_roles` caches Discord role metadata

**Expected Schema:**
```typescript
export type GuildRole = {
  id: string;
  discord_role_id: string;  // Discord snowflake ID
  name: string;              // Role name (e.g., "Premium Member")
  color: number;             // Role color (Discord color int)
  position: number;          // Role hierarchy position
  icon_url?: string;         // Role icon/emoji
  permissions?: string;      // Discord permissions bitfield
  created_at: string;
  updated_at: string;
};
```

#### 4.3 Create Guild Roles Sync Service

**New File:** `src/lib/supabase/services/guild-roles.service.ts`

```typescript
import { supabase } from '../client';
import { discordApi } from '@/lib/discord/api';

export const guildRolesService = {

  /**
   * Sync Discord roles from API to guild_roles table
   * Call this periodically or when admin panel is accessed
   */
  syncGuildRoles: async (accessToken: string) => {
    try {
      // Fetch roles from Discord API
      const discordRoles = await discordApi.fetchGuildRoles(accessToken);

      // Upsert to guild_roles table
      const rolesToUpsert = discordRoles.map(role => ({
        discord_role_id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        icon_url: role.icon || null
      }));

      const { data, error } = await supabase
        .from('guild_roles')
        .upsert(rolesToUpsert, {
          onConflict: 'discord_role_id'
        })
        .select();

      return { data, error };

    } catch (error) {
      console.error('Error syncing guild roles:', error);
      return { data: null, error };
    }
  },

  /**
   * Get cached guild roles from database
   * Avoids hitting Discord API every time
   */
  getCachedGuildRoles: async () => {
    const { data, error } = await supabase
      .from('guild_roles')
      .select('*')
      .order('position', { ascending: false });

    return { data, error };
  },

  /**
   * Get a specific role by Discord ID
   */
  getRoleByDiscordId: async (discordRoleId: string) => {
    const { data, error } = await supabase
      .from('guild_roles')
      .select('*')
      .eq('discord_role_id', discordRoleId)
      .single();

    return { data, error };
  }
};
```

#### 4.4 Update RoleAccessManager to Use Cached Roles

Modify `RoleAccessManager.tsx` to try cached roles first, fall back to API.

---

## Phase 5: Create Developer Documentation

**Priority:** Medium
**Estimated Time:** 3-4 hours
**Dependencies:** All previous phases

### Tasks

#### 5.1 Access Control Guide

**New File:** `docs/ACCESS_CONTROL.md`

```markdown
# Access Control Architecture

## Overview
This document explains how user authentication and course access control work in the Siadlak LMS.

## Tables Involved
- `users` - User accounts from Discord OAuth
- `user_roles` - Maps users to their Discord role IDs
- `guild_roles` - Caches Discord role metadata (names, colors, etc.)
- `course_roles` - Maps Discord roles to courses they can access

## Flow Diagrams
[Include detailed flow diagrams]

## Adding a New Course
[Step-by-step guide]

## Granting Role Access
[Step-by-step guide]

## Testing Access Control
[Testing guide]
```

#### 5.2 Database Schema Guide

**New File:** `docs/DATABASE_SCHEMA_GUIDE.md`

Comprehensive guide including:
- Table relationships
- Foreign keys
- Indexes
- RLS policies
- Migration strategy

#### 5.3 Development Workflow

**New File:** `docs/DEVELOPMENT_WORKFLOW.md`

Include:
- How to add new tables
- How to modify RLS policies
- How to regenerate types
- Testing strategy

---

## Phase 6: Testing & Validation

**Priority:** High
**Estimated Time:** 4-6 hours
**Dependencies:** Phases 1-3

### Tasks

#### 6.1 Create Test Users

Set up test users with different role configurations:
- User with no roles
- User with single role
- User with multiple roles
- Admin user

#### 6.2 Test Access Control

For each test user:
- [ ] Can see correct courses
- [ ] Cannot see unauthorized courses
- [ ] Can access course details
- [ ] Can access modules/lessons
- [ ] Progress tracking works

#### 6.3 Test Admin Panel

- [ ] Can assign roles to courses
- [ ] Can remove role assignments
- [ ] Changes reflect immediately for users

#### 6.4 Test Edge Cases

- [ ] User loses role (course disappears)
- [ ] User gains role (course appears)
- [ ] Course with no role restrictions
- [ ] Deleted Discord role handling

---

## Phase 7: Migration & Deployment

**Priority:** Critical
**Estimated Time:** 2-3 hours
**Dependencies:** All previous phases

### Pre-Deployment Checklist

- [ ] All TypeScript types regenerated and committed
- [ ] All broken code fixed
- [ ] RLS policies documented and verified
- [ ] Tests pass
- [ ] Documentation complete
- [ ] No console errors in dev build
- [ ] Production build succeeds

### Deployment Steps

1. **Backup database** (Supabase dashboard)
2. Run migration scripts (if any)
3. Deploy updated code
4. Verify RLS policies on production
5. Test with real users
6. Monitor for errors

### Rollback Plan

If issues occur:
1. Revert code deployment
2. Restore database from backup
3. Investigate issues in staging environment

---

## Success Criteria

### Must Have (P0)
- ✅ All 20 tables have TypeScript types
- ✅ `course.service.ts` uses correct database fields
- ✅ Access control works correctly for all user types
- ✅ No TypeScript compilation errors
- ✅ RLS policies documented

### Should Have (P1)
- ✅ `guild_roles` table purpose clarified and implemented
- ✅ Centralized access control service
- ✅ Developer documentation complete
- ✅ Test suite for access control

### Nice to Have (P2)
- ⭐ Automated RLS policy testing
- ⭐ Performance monitoring for access checks
- ⭐ Audit logging for role changes
- ⭐ Admin UI improvements

---

## Risk Assessment

### High Risk
- **RLS policy conflicts** - Existing policies may conflict with code changes
  - *Mitigation:* Test thoroughly in staging, have rollback plan

- **Breaking changes for existing users** - Users may lose access temporarily
  - *Mitigation:* Run migration during low-traffic period, monitor closely

### Medium Risk
- **Type errors** - Regenerating types may break existing code
  - *Mitigation:* Fix incrementally, test each change

- **Performance** - Access control queries may be slow
  - *Mitigation:* Add indexes, optimize queries, cache where appropriate

### Low Risk
- **Documentation drift** - Docs may become outdated
  - *Mitigation:* Include docs in code review process

---

## Timeline Estimate

| Phase | Duration | Can Start After |
|-------|----------|----------------|
| Phase 1: TypeScript Types | 1-2 hours | Immediately |
| Phase 2: Fix Access Control | 3-4 hours | Phase 1 |
| Phase 3: Document RLS | 4-6 hours | Phase 2 |
| Phase 4: Guild Roles | 2-3 hours | Phase 1 |
| Phase 5: Documentation | 3-4 hours | Phases 2-4 |
| Phase 6: Testing | 4-6 hours | Phases 1-3 |
| Phase 7: Deployment | 2-3 hours | Phase 6 |

**Total Estimated Time:** 19-28 hours
**Recommended Timeline:** 3-5 days with 1 developer

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Prioritize phases** based on business needs
3. **Set up staging environment** for testing
4. **Begin Phase 1** - Regenerate TypeScript types
5. **Track progress** using GitHub issues or similar

---

## Questions to Answer Before Starting

1. Are there existing RLS policies we need to preserve?
2. Do we have a staging/test Supabase instance?
3. What's the acceptable downtime window for migration?
4. Do we need to notify users before making changes?
5. Are there any undocumented tables or features we should know about?
6. What's the current user load and performance baseline?

---

**Document Owner:** Claude (AI Assistant)
**Last Updated:** 2026-01-31
**Status:** Draft - Pending Review
