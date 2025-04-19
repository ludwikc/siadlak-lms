
import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import {
  Book,
  LayoutGrid,
  Settings,
  FilePlus,
  Users,
  Clock,
  BarChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboardPage: React.FC = () => {
  const { isLoading, courses, recentlyUpdated, refreshData } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-discord-header-text">Admin Dashboard</h1>
          <p className="text-discord-secondary-text">Manage your courses, modules, and lessons</p>
        </div>
        <button
          onClick={() => refreshData()}
          className="inline-flex items-center gap-2 self-start rounded-md bg-discord-brand px-4 py-2 text-white transition-opacity hover:opacity-90 sm:self-center"
        >
          <Clock className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </header>

      {/* Dashboard overview cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
          <CardHeader className="pb-2">
            <CardTitle className="text-discord-header-text">Total Courses</CardTitle>
            <CardDescription className="text-discord-secondary-text">All published and draft courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Book className="h-8 w-8 text-discord-brand" />
              <span className="text-3xl font-bold text-discord-header-text">{courses}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
          <CardHeader className="pb-2">
            <CardTitle className="text-discord-header-text">Recent Updates</CardTitle>
            <CardDescription className="text-discord-secondary-text">Content updated in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-discord-secondary-text">Courses</span>
                <span className="font-semibold text-discord-header-text">{recentlyUpdated.courses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-discord-secondary-text">Modules</span>
                <span className="font-semibold text-discord-header-text">{recentlyUpdated.modules}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-discord-secondary-text">Lessons</span>
                <span className="font-semibold text-discord-header-text">{recentlyUpdated.lessons}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
          <CardHeader className="pb-2">
            <CardTitle className="text-discord-header-text">Quick Stats</CardTitle>
            <CardDescription className="text-discord-secondary-text">Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[80px] items-center justify-center text-discord-secondary-text">
              <BarChart className="h-8 w-8" />
              <span className="ml-2">Coming soon</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
          <CardHeader className="pb-2">
            <CardTitle className="text-discord-header-text">User Engagement</CardTitle>
            <CardDescription className="text-discord-secondary-text">Course completion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[80px] items-center justify-center text-discord-secondary-text">
              <Users className="h-8 w-8" />
              <span className="ml-2">Coming soon</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick action buttons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-discord-header-text">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/courses"
            className="flex flex-col items-center rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6 text-center transition-colors hover:bg-discord-sidebar-bg"
          >
            <LayoutGrid className="mb-2 h-10 w-10 text-discord-brand" />
            <span className="mt-2 font-medium text-discord-header-text">Manage Courses</span>
          </Link>
          
          <Link
            to="/admin/courses/new"
            className="flex flex-col items-center rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6 text-center transition-colors hover:bg-discord-sidebar-bg"
          >
            <FilePlus className="mb-2 h-10 w-10 text-discord-brand" />
            <span className="mt-2 font-medium text-discord-header-text">Create New Course</span>
          </Link>
          
          <Link
            to="/admin/roles"
            className="flex flex-col items-center rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6 text-center transition-colors hover:bg-discord-sidebar-bg"
          >
            <Users className="mb-2 h-10 w-10 text-discord-brand" />
            <span className="mt-2 font-medium text-discord-header-text">Manage Roles</span>
          </Link>
          
          <Link
            to="/admin/settings"
            className="flex flex-col items-center rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6 text-center transition-colors hover:bg-discord-sidebar-bg"
          >
            <Settings className="mb-2 h-10 w-10 text-discord-brand" />
            <span className="mt-2 font-medium text-discord-header-text">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
