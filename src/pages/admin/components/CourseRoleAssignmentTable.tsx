
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
type RoleMatrix = { [discordRoleId: string]: Set<string> };

interface CourseRoleAssignmentTableProps {
  discordRoles: DiscordRole[];
  courses: Course[];
  assigned: RoleMatrix;
  toggleRoleCourse: (roleId: string, courseId: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const CourseRoleAssignmentTable: React.FC<CourseRoleAssignmentTableProps> = ({
  discordRoles,
  courses,
  assigned,
  toggleRoleCourse,
  onSave,
  isSaving
}) => (
  <div className="flex-1 min-w-0">
    <div className="bg-card rounded-lg shadow border">
      <div className="p-5">
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
              {[...discordRoles].sort((a, b) => b.position - a.position).map((role) => (
                <tr key={role.id}>
                  <td className="align-top px-4 py-2 whitespace-nowrap text-discord-secondary-text">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block rounded-full w-3 h-3 ring-2 ring-discord-header-text"
                        style={{
                          backgroundColor: `#${role.color.toString(16).padStart(6, "0")}`
                        }}
                        title={`role color: #${role.color.toString(16)}`}
                      />
                      {role.name}
                    </div>
                  </td>
                  <td className="align-top px-4 py-2">
                    <div className="bg-discord-sidebar-bg rounded p-2 flex flex-wrap gap-1">
                      {courses.map((course) => (
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
              disabled={isSaving}
              onClick={onSave}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CourseRoleAssignmentTable;
