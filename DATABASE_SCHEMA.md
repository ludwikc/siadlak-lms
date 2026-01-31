# Supabase Database Schema

**Project Reference:** `taswmdahpcubiyrgsjki`
**Project URL:** `https://taswmdahpcubiyrgsjki.supabase.co`

## Important Note

⚠️ **TypeScript types are OUT OF SYNC with the actual database**

The database contains **20 tables**, but the TypeScript types file (`src/integrations/supabase/types.ts`) only includes **10 tables**. The types need to be regenerated from the database.

---

## Complete Table List (20 Tables)

### Tables with TypeScript Types (10)

#### 1. **courses**
- **id** (uuid, PK)
- **title** (text)
- **slug** (text)
- **description** (text, nullable)
- **thumbnail_url** (text, nullable)
- **created_at** (timestamp, nullable)
- **updated_at** (timestamp, nullable)

**Purpose:** Core course information

---

#### 2. **modules**
- **id** (uuid, PK)
- **course_id** (uuid, FK → courses)
- **title** (text)
- **slug** (text)
- **order_index** (integer)
- **discord_thread_url** (text, nullable)
- **created_at** (timestamp, nullable)
- **updated_at** (timestamp, nullable)

**Purpose:** Course sections/modules

---

#### 3. **lessons**
- **id** (uuid, PK)
- **module_id** (uuid, FK → modules)
- **title** (text)
- **slug** (text)
- **content** (text, nullable)
- **media_type** (text, nullable) - 'text' | 'video' | 'audio'
- **media_url** (text, nullable)
- **transcript** (text, nullable)
- **order_index** (integer)
- **created_at** (timestamp, nullable)
- **updated_at** (timestamp, nullable)

**Purpose:** Individual lessons with media content

---

#### 4. **users**
- **id** (uuid, PK)
- **discord_id** (text)
- **discord_username** (text)
- **discord_avatar** (text, nullable)
- **is_admin** (boolean, nullable)
- **roles** (text[], array)
- **settings** (json, nullable)
- **last_login** (timestamp, nullable)
- **created_at** (timestamp, nullable)
- **updated_at** (timestamp, nullable)

**Purpose:** User accounts and authentication

---

#### 5. **user_roles**
- **id** (uuid, PK)
- **user_id** (uuid, FK → users)
- **discord_role_id** (text)
- **created_at** (timestamp, nullable)

**Purpose:** Discord role assignments

---

#### 6. **course_roles**
- **id** (uuid, PK)
- **course_id** (uuid, FK → courses)
- **discord_role_id** (text)
- **created_at** (timestamp, nullable)

**Purpose:** Course access control via Discord roles

---

#### 7. **user_progress**
- **id** (uuid, PK)
- **user_id** (uuid, FK → users)
- **lesson_id** (uuid, FK → lessons)
- **completed** (boolean, nullable)
- **last_position** (integer, nullable)
- **created_at** (timestamp, nullable)
- **updated_at** (timestamp, nullable)

**Purpose:** Track lesson completion and playback position

---

#### 8. **upgrades**
- **id** (uuid, PK)
- **title** (text)
- **description** (text)
- **category** (text)
- **status** (enum: 'pending' | 'done')
- **created_by_discord_username** (text)
- **votes** (integer, nullable)
- **completed_at** (timestamp, nullable)
- **completion_link** (text, nullable)
- **created_at** (timestamp)
- **updated_at** (timestamp)

**Purpose:** Feature requests and upgrade suggestions

---

#### 9. **upgrade_votes**
- **id** (uuid, PK)
- **upgrade_id** (uuid, FK → upgrades)
- **user_id** (uuid, FK → users)
- **created_at** (timestamp)

**Purpose:** Vote tracking for upgrades

---

#### 10. **webinars**
- **id** (uuid, PK)
- **title** (text)
- **description** (text)
- **created_by** (text)
- **votes** (integer, nullable)
- **user_votes** (json, nullable)
- **created_at** (timestamp, nullable)

**Purpose:** Webinar/event management

---

### Tables WITHOUT TypeScript Types (10)

⚠️ **These tables exist in the database but are not reflected in the TypeScript types**

#### 11. **badges**
**Purpose:** User achievement/badge system (schema unknown - needs type generation)

---

#### 12. **cohort_members**
**Purpose:** Cohort/group membership tracking (schema unknown - needs type generation)

---

#### 13. **feature_requests**
**Purpose:** Feature request tracking (may be related to or replace upgrades table)

---

#### 14. **feature_votes**
**Purpose:** Voting on feature requests (may be related to or replace upgrade_votes table)

---

#### 15. **guild_roles**
**Purpose:** Likely caches Discord role definitions (name, color, position, icons) to avoid hitting Discord API rate limits
**Schema:** Unknown - needs type generation
**Note:** NOT used for course access control - see `course_roles` table instead

---

#### 16. **lesson_events**
**Purpose:** Event tracking for lessons (analytics, views, completions, etc.)

---

#### 17. **pending_users**
**Purpose:** Users pending approval or verification (schema unknown - needs type generation)

---

#### 18. **purchase_history**
**Purpose:** Transaction/purchase records (schema unknown - needs type generation)

---

#### 19. **resource_categories**
**Purpose:** Resource organization categories (schema unknown - needs type generation)

---

#### 20. **resource_grants**
**Purpose:** Resource access permissions (schema unknown - needs type generation)

---

#### 21. **role_assignment_audit**
**Purpose:** Audit log for role assignments (schema unknown - needs type generation)

---

#### 22. **xp_events**
**Purpose:** Experience points/gamification events (schema unknown - needs type generation)

---

### Views

#### **v_course_progress**
**Purpose:** Calculated view of user course progress (schema unknown - needs type generation)

---

## Database Functions (RPC Procedures)

1. **create_course** - Creates a new course (admin-only)
2. **create_module** - Creates a new module within a course (admin-only)
3. **create_lesson** - Creates a new lesson within a module (admin-only)
4. **update_module** - Updates module details (admin-only)
5. **update_lesson** - Updates lesson details (admin-only)
6. **delete_module** - Deletes a module (admin-only)
7. **delete_lesson** - Deletes a lesson (admin-only)
8. **reorder_modules** - Reorders modules within a course (admin-only)
9. **reorder_lessons** - Reorders lessons within a module (admin-only)
10. **handle_discord_login** - Handles Discord OAuth login
11. **is_admin** - Checks if user has admin privileges
12. **is_authorized_discord_user** - Checks if user is authorized
13. **mark_upgrade_as_done** - Marks an upgrade as completed

---

## Enums

**upgrade_status**: "pending" | "done"

---

## How to Update TypeScript Types

To regenerate the TypeScript types from your Supabase database:

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref taswmdahpcubiyrgsjki

# Generate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to API Docs → TypeScript
3. Copy the generated types
4. Replace the contents of `src/integrations/supabase/types.ts`

### Option 3: Using npx (No installation)

```bash
npx supabase gen types typescript --project-id taswmdahpcubiyrgsjki --schema public > src/integrations/supabase/types.ts
```

You'll need to provide your Supabase access token when prompted.

---

## Database Hierarchy

```
courses
  └─ modules
      └─ lessons
          └─ user_progress

users
  ├─ user_roles
  ├─ user_progress
  ├─ upgrade_votes
  └─ (other user-related tables)

course_roles → courses (access control)
guild_roles → user_roles (Discord integration)
```

---

## Notes

- The database uses Discord OAuth for authentication
- All content management requires admin privileges
- Course access is controlled via Discord roles
- The system supports text, video, and audio lessons
- Progress tracking includes completion status and playback position
- Community features include voting on upgrades/features and webinar management
- Gamification features include badges and XP events
- Purchase history suggests a monetization component

---

---

## Access Control Deep Dive

### Course Access Authorization

**Primary Mechanism:** `course_roles` table (NOT `guild_roles`)

#### How It Works:

1. **Admin Panel** (`RoleAccessManager.tsx`):
   - Fetches Discord roles via Discord API
   - Maps Discord roles to courses via `course_roles` table
   - Structure: `discord_role_id` → `course_id`

2. **Database-Level Enforcement** (Row Level Security):
   - Supabase RLS policies enforce access control at the database level
   - Evidence: Code comments mention "bypass RLS" when using RPC functions
   - RLS policies check user's Discord roles against `course_roles` table

3. **Application-Level Code** (`course.service.ts`):
   - ⚠️ Contains outdated/broken logic (lines 27-66)
   - References non-existent fields: `role_id`, `allowed_roles`
   - **However, this code path may not be used** due to RLS policies

### `guild_roles` vs `course_roles`

| Table | Purpose | Used For |
|-------|---------|----------|
| **course_roles** | Maps Discord roles to courses | ✅ Course access control |
| **guild_roles** | Caches Discord role metadata | ❌ NOT for access control |

**guild_roles** likely stores:
- Role names
- Role colors
- Role positions
- Role icons/emojis

This avoids repeatedly hitting the Discord API (which has rate limits) when displaying role information.

**course_roles** stores only:
- `id` (uuid, PK)
- `course_id` (uuid, FK)
- `discord_role_id` (text)
- `created_at` (timestamp)

### Access Control Flow

```
User Login
  ↓
Discord OAuth → User object with roles array
  ↓
User roles stored in user.roles[] (from Discord)
  ↓
RLS Policy checks:
  - Query course_roles WHERE discord_role_id IN (user.roles)
  - Filter courses by matching course_ids
  ↓
User sees only authorized courses
```

### Code Issues vs Runtime Behavior

**Discrepancy Found:**
- `course.service.ts` has broken logic that references non-existent database fields
- **However**, access control still works because:
  1. Supabase RLS policies handle authorization at the database level
  2. The broken application code may not be the primary access control path
  3. Direct SQL queries are filtered by RLS regardless of application logic

**Recommendation:**
- Fix `course.service.ts` to use `course_roles` table properly
- OR remove the broken code if RLS policies handle all access control
- Update TypeScript types to include all 20 tables

---

**Last Updated:** 2026-01-31
**Status:** Types need regeneration - 10 additional tables missing from TypeScript definitions
