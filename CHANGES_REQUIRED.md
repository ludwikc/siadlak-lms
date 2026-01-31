# Changes Required - Quick Reference

This document lists all files that need changes for the access control fix.

---

## Critical Changes (Must Fix)

### 1. `src/lib/supabase/services/course.service.ts`

**Lines 11-66** - Replace entire `getAccessibleCourses` function

**Current Problem:**
- Line 29: References `role_id` (should be `discord_role_id`)
- Line 40: References `allowed_roles` field (doesn't exist on courses table)
- Line 56: References `allowed_roles` field (doesn't exist on courses table)

**Quick Fix (Option A - Recommended):**
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

**Proper Fix (Option B - Explicit):**
```typescript
const getAccessibleCourses = async (userId: string, isAdmin = false) => {
  try {
    if (isAdmin) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    }

    // Get user's Discord role IDs
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    if (!userRoles || userRoles.length === 0) {
      return { data: [], error: null };
    }

    // Get course IDs from course_roles
    const discordRoleIds = userRoles.map(r => r.discord_role_id);

    const { data: courseRoles, error: courseRolesError } = await supabase
      .from('course_roles')
      .select('course_id')
      .in('discord_role_id', discordRoleIds);

    if (courseRolesError) throw courseRolesError;

    if (!courseRoles || courseRoles.length === 0) {
      return { data: [], error: null };
    }

    // Fetch courses
    const courseIds = [...new Set(courseRoles.map(cr => cr.course_id))];

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data, error: null };

  } catch (error) {
    console.error('Error fetching accessible courses:', error);
    return { data: null, error };
  }
};
```

---

## Type Generation (Critical)

### 2. Regenerate All TypeScript Types

**Files Affected:**
- `src/integrations/supabase/types.ts` (auto-generated)
- `src/lib/supabase/types.ts` (manual types)

**Command:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref taswmdahpcubiyrgsjki

# Generate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

**After generation, update:**
`src/lib/supabase/types.ts` - Add custom types for new tables

---

## New Files to Create

### 3. Access Control Service (Recommended)

**New File:** `src/lib/supabase/services/access-control.service.ts`

```typescript
import { supabase } from '../client';

export const accessControlService = {
  /**
   * Check if user can access a course
   */
  canAccessCourse: async (
    userId: string,
    courseId: string,
    isAdmin = false
  ): Promise<{ hasAccess: boolean; error: any }> => {
    try {
      if (isAdmin) {
        return { hasAccess: true, error: null };
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('discord_role_id')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        return { hasAccess: false, error: null };
      }

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
   * Sync user roles from Discord
   */
  syncUserRoles: async (userId: string, discordRoleIds: string[]) => {
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

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

### 4. Guild Roles Service (Optional but Recommended)

**New File:** `src/lib/supabase/services/guild-roles.service.ts`

```typescript
import { supabase } from '../client';
import { discordApi } from '@/lib/discord/api';

export const guildRolesService = {
  /**
   * Sync Discord roles to database cache
   */
  syncGuildRoles: async (accessToken: string) => {
    try {
      const discordRoles = await discordApi.fetchGuildRoles(accessToken);

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
   * Get cached guild roles
   */
  getCachedGuildRoles: async () => {
    const { data, error } = await supabase
      .from('guild_roles')
      .select('*')
      .order('position', { ascending: false });

    return { data, error };
  }
};
```

---

## Database Migrations

### 5. Document RLS Policies

**New File:** `supabase/migrations/20260131_document_rls_policies.sql`

```sql
-- =====================================================
-- RLS POLICIES DOCUMENTATION
-- These may already exist - run to recreate if needed
-- =====================================================

-- COURSES TABLE
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to courses"
ON courses FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- Users can read courses based on their roles
CREATE POLICY "Users can read courses based on their roles"
ON courses FOR SELECT TO authenticated
USING (
  id IN (
    SELECT cr.course_id
    FROM course_roles cr
    INNER JOIN user_roles ur ON cr.discord_role_id = ur.discord_role_id
    WHERE ur.user_id = auth.uid()
  )
);

-- MODULES TABLE
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to modules"
ON modules FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Users can read modules based on course access"
ON modules FOR SELECT TO authenticated
USING (
  course_id IN (
    SELECT cr.course_id
    FROM course_roles cr
    INNER JOIN user_roles ur ON cr.discord_role_id = ur.discord_role_id
    WHERE ur.user_id = auth.uid()
  )
);

-- LESSONS TABLE
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to lessons"
ON lessons FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Users can read lessons based on course access"
ON lessons FOR SELECT TO authenticated
USING (
  module_id IN (
    SELECT m.id FROM modules m
    INNER JOIN course_roles cr ON m.course_id = cr.course_id
    INNER JOIN user_roles ur ON cr.discord_role_id = ur.discord_role_id
    WHERE ur.user_id = auth.uid()
  )
);

-- USER_PROGRESS TABLE
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
ON user_progress FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- USER_ROLES TABLE
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles"
ON user_roles FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- COURSE_ROLES TABLE
ALTER TABLE course_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read course roles"
ON course_roles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage course roles"
ON course_roles FOR INSERT, UPDATE, DELETE TO authenticated
USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));
```

---

## Optional Improvements

### 6. Update Service Index

**File:** `src/lib/supabase/services/index.ts`

Add exports for new services:

```typescript
export { accessControlService } from './access-control.service';
export { guildRolesService } from './guild-roles.service';
```

### 7. Update RoleAccessManager

**File:** `src/pages/admin/components/RoleAccessManager.tsx`

**Lines 47-66** - Consider using cached guild roles:

```typescript
const {
  data: discordRoles,
  isLoading: loadingRoles,
  error: rolesError,
  refetch: refetchRoles,
} = useQuery({
  queryKey: ["discord-roles"],
  queryFn: async () => {
    // Try cached roles first
    const { data: cachedRoles } = await guildRolesService.getCachedGuildRoles();

    if (cachedRoles && cachedRoles.length > 0) {
      return cachedRoles;
    }

    // Fall back to API
    const accessToken = await getDiscordAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated with Discord.");
    }

    const apiRoles = await discordApi.fetchGuildRoles(accessToken);

    // Sync to cache in background
    guildRolesService.syncGuildRoles(accessToken).catch(console.error);

    return apiRoles;
  },
});
```

---

## Testing Checklist

After making changes:

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No console errors in development
- [ ] Admin can see all courses
- [ ] Regular user sees only authorized courses
- [ ] User with no roles sees no courses
- [ ] Course access changes when roles change
- [ ] Progress tracking still works
- [ ] Admin panel role assignment works

---

## Quick Start Implementation Order

1. **Regenerate types** (5 minutes)
2. **Fix course.service.ts** (10 minutes - use Option A)
3. **Test in development** (15 minutes)
4. **Create access-control.service.ts** (15 minutes)
5. **Document RLS policies** (20 minutes)
6. **Full testing** (30 minutes)

**Total Quick Fix:** ~1.5 hours for core functionality

---

## Need Help?

Refer to:
- `IMPLEMENTATION_PLAN.md` - Full detailed plan
- `DATABASE_SCHEMA.md` - Table documentation
- `MCP_SETUP.md` - MCP server setup

---

**Last Updated:** 2026-01-31
