
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discordApi } from "@/lib/discord/api";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
      console.log("Fetching Discord roles with access token");
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

  if (loadingRoles || loadingCourses || loadingMappings) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center">Loading Discord roles and courses…</p>
        </CardContent>
      </Card>
    );
  }

  // Special handling for Discord authentication errors
  if (rolesError && rolesError instanceof Error && (
      rolesError.message.includes("401") || 
      rolesError.message.includes("Not authenticated") ||
      rolesError.message.includes("Failed to fetch guild roles")
    )) {
    return (
      <ErrorState
        title="Discord Authentication Required"
        message="Your Discord token appears to be expired or invalid. Please sign out and sign back in with Discord to refresh your access."
        severity="warning"
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

  if (rolesError || coursesError || mappingError) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
            <p className="text-sm text-discord-secondary-text mb-4">
              {rolesError?.message || coursesError?.message || mappingError?.message}
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                queryClient.invalidateQueries();
                window.location.reload();
              }}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!discordRoles?.length || !courses?.length) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center">
            No Discord roles or courses found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <div className="md:w-1/4 w-full">
        <div className="rounded-lg bg-discord-sidebar-bg p-4 border border-discord-sidebar-bg">
          <h2 className="text-xl font-bold mb-2 text-discord-header-text">Discord Roles</h2>
          <ul className="space-y-1">
            {discordRoles
              .sort((a: DiscordRole, b: DiscordRole) => b.position - a.position)
              .map((role: DiscordRole) => (
              <li
                key={role.id}
                className="flex items-center space-x-2 p-2 rounded bg-discord-deep-bg hover:bg-discord-sidebar-bg transition"
              >
                <span
                  className="inline-block rounded-full w-3 h-3 ring-2 ring-discord-header-text"
                  style={{ backgroundColor: `#${role.color.toString(16).padStart(6, "0")}` }}
                  title={`role color: #${role.color.toString(16)}`}
                />
                <span className="text-discord-secondary-text">{role.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mt-2 mb-4 text-discord-header-text">
              Assign Courses to Discord Roles
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="text-left font-semibold px-4 py-2">Role</th>
                    <th className="text-left font-semibold px-4 py-2">Accessible Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {discordRoles
                    .sort((a: DiscordRole, b: DiscordRole) => b.position - a.position)
                    .map((role: DiscordRole) => (
                    <tr key={role.id}>
                      <td className="align-top px-4 py-2 whitespace-nowrap text-discord-secondary-text">
                        <div className="flex items-center gap-2">
                          <span className="inline-block rounded-full w-3 h-3 ring-2 ring-discord-header-text"
                                style={{ backgroundColor: `#${role.color.toString(16).padStart(6, "0")}` }}
                                title={`role color: #${role.color.toString(16)}`} />
                          {role.name}
                        </div>
                      </td>
                      <td className="align-top px-4 py-2">
                        <div className="bg-discord-sidebar-bg rounded p-2 flex flex-wrap gap-1">
                          {courses.map((course: Course) => (
                            <label
                              key={`${role.id}-${course.id}`}
                              className="inline-flex items-center gap-2 cursor-pointer mr-3 mb-1"
                            >
                              <Checkbox
                                checked={
                                  assigned[role.id]?.has(course.id) || false
                                }
                                onCheckedChange={() =>
                                  toggleRoleCourse(role.id, course.id)
                                }
                              />
                              <span className="text-discord-text text-sm">
                                {course.title}
                                <span className="text-discord-secondary-text text-xs ml-1 opacity-60">
                                  [{course.slug}]
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-6">
                <Button
                  variant="default"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleAccessManager;
