
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discordApi } from "@/lib/discord/api";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import DiscordRoleList from "./DiscordRoleList";
import CourseRoleAssignmentTable from "./CourseRoleAssignmentTable";
import ErrorDisplay from "./ErrorDisplay";

// Minimal type definitions for Discord Role and Course
type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

type Course = {
  id: string;
  title: string;
  slug: string;
};

type CourseRole = {
  id: string;
  course_id: string;
  discord_role_id: string;
};

type RoleMatrix = { [discordRoleId: string]: Set<string> }; // role_id -> set of course_id

// Utility for obtaining Discord accessToken from Supabase session
async function getDiscordAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
}

const RoleAccessManager: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries: Discord roles, courses, mappings
  const {
    data: discordRoles,
    isLoading: loadingRoles,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["discord-roles"],
    queryFn: async () => {
      const accessToken = await getDiscordAccessToken();
      if (!accessToken) {
        throw new Error("Not authenticated with Discord. Please sign in again with Discord to refresh your token.");
      }
      return discordApi.fetchGuildRoles(accessToken);
    },
  });

  const {
    data: courses,
    isLoading: loadingCourses,
    error: coursesError,
  } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug");
      if (error) throw error;
      return data as Course[];
    },
  });

  const {
    data: courseRoleMap,
    isLoading: loadingMappings,
    error: mappingError,
  } = useQuery({
    queryKey: ["course-role-mapping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_roles")
        .select("id, course_id, discord_role_id");
      if (error) throw error;
      // Build matrix: role_id -> Set(course_ids)
      const matrix: RoleMatrix = {};
      (data as CourseRole[]).forEach(row => {
        if (!matrix[row.discord_role_id]) matrix[row.discord_role_id] = new Set();
        matrix[row.discord_role_id].add(row.course_id);
      });
      return matrix;
    },
  });

  // UI state: editable matrix of assignments
  const [assigned, setAssigned] = useState<RoleMatrix>({});

  // Sync editable state to fetched data
  useEffect(() => {
    if (discordRoles && courses && courseRoleMap) {
      const snap: RoleMatrix = {};
      discordRoles.forEach((role: DiscordRole) => {
        snap[role.id] = new Set(courseRoleMap[role.id] ?? []);
      });
      setAssigned(snap);
    }
  }, [discordRoles, courses, courseRoleMap]);

  // Editing: toggle course for a role
  const toggleRoleCourse = (roleId: string, courseId: string) => {
    setAssigned(prev => {
      const newMap = { ...prev };
      const current = new Set(newMap[roleId]);
      if (current.has(courseId)) {
        current.delete(courseId);
      } else {
        current.add(courseId);
      }
      newMap[roleId] = current;
      return newMap;
    });
  };

  // Save Changes (update Supabase to match edited assignments)
  const mutation = useMutation({
    mutationFn: async () => {
      if (!discordRoles || !courses) return;

      // Fetch all current assignments from Supabase again (just in case)
      const { data: rows, error } = await supabase
        .from("course_roles")
        .select("id, course_id, discord_role_id");

      if (error) throw error;
      const orig: CourseRole[] = (rows as CourseRole[]) || [];

      // Figure out the new state desired
      const newAssignments: { role: string; courses: Set<string> }[] = [];
      Object.entries(assigned).forEach(([roleId, courseSet]) => {
        newAssignments.push({ role: roleId, courses: courseSet });
      });

      // Build a set of all desired rows (roleId, courseId)
      const targetSet = new Set<string>();
      newAssignments.forEach(({ role, courses }) => {
        courses.forEach(cid => targetSet.add(`${role}:${cid}`));
      });

      // Build set of current in-db rows as keys
      const existingSet = new Set<string>();
      orig.forEach(r => existingSet.add(`${r.discord_role_id}:${r.course_id}`));

      // To delete: in-db but not in-target
      const toDelete = orig.filter(
        r => !targetSet.has(`${r.discord_role_id}:${r.course_id}`)
      );

      // To insert: in-target but not in-db
      const toInsert: { discord_role_id: string; course_id: string }[] = [];
      newAssignments.forEach(({ role, courses }) => {
        courses.forEach(cid => {
          if (!existingSet.has(`${role}:${cid}`)) {
            toInsert.push({ discord_role_id: role, course_id: cid });
          }
        });
      });

      // Perform deletes
      if (toDelete.length > 0) {
        await supabase
          .from("course_roles")
          .delete()
          .in(
            "id",
            toDelete.map(r => r.id)
          );
      }
      // Perform inserts
      if (toInsert.length > 0) {
        await supabase
          .from("course_roles")
          .insert(toInsert);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-role-mapping"] });
      toast({
        title: "Success",
        description: "Course role assignments updated!",
        variant: "default",
      });
    },
    onError: err => {
      toast({
        title: "Error",
        description: "Failed to save changes: " + (err as Error).message,
        variant: "destructive",
      });
    }
  });

  // Loading state
  if (loadingRoles || loadingCourses || loadingMappings) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="bg-card rounded shadow px-8 py-6 text-center">
          <p className="text-muted-foreground">Loading Discord roles and courses…</p>
        </div>
      </div>
    );
  }

  // Special handling for Discord authentication errors
  if (
    rolesError &&
    rolesError instanceof Error &&
    (
      rolesError.message.includes("401") ||
      rolesError.message.includes("Not authenticated") ||
      rolesError.message.includes("Failed to fetch guild roles")
    )
  ) {
    return (
      <ErrorDisplay
        title="Discord Authentication Required"
        message="Your Discord token appears to be expired or invalid. Please sign out and sign back in with Discord to refresh your access."
        retryLabel="Try Again"
        onRetry={() => refetchRoles()}
        actionLabel="Sign Out"
        onAction={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
      />
    );
  }

  // General error state
  if (rolesError || coursesError || mappingError) {
    return (
      <ErrorDisplay
        title="Error Loading Data"
        message={rolesError?.message || coursesError?.message || mappingError?.message || "Unknown error"}
        retryLabel="Retry"
        onRetry={() => {
          queryClient.invalidateQueries();
          window.location.reload();
        }}
      />
    );
  }

  if (!discordRoles?.length || !courses?.length) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="bg-card rounded shadow px-8 py-6 text-center">
          <p className="text-muted-foreground">No Discord roles or courses found.</p>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <div className="md:w-1/4 w-full">
        <DiscordRoleList roles={discordRoles} />
      </div>
      <CourseRoleAssignmentTable
        discordRoles={discordRoles}
        courses={courses}
        assigned={assigned}
        toggleRoleCourse={toggleRoleCourse}
        onSave={() => mutation.mutate()}
        isSaving={mutation.isPending}
      />
    </div>
  );
};

export default RoleAccessManager;
