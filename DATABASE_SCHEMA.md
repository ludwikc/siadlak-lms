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
**Purpose:** Discord guild/server role definitions (schema unknown - needs type generation)

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

**Last Updated:** 2026-01-31
**Status:** Types need regeneration - 10 additional tables missing from TypeScript definitions
