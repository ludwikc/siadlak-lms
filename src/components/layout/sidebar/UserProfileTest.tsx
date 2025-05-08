import React, { useState } from 'react';
import UserProfile from './UserProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExtendedUser } from '@/types/auth';

// Mock user data for testing
const mockUsers: Record<string, ExtendedUser> = {
  complete: {
    id: 'mock-user-1',
    email: 'user@example.com',
    discord_id: '123456789',
    discord_username: 'CompleteUser',
    discord_avatar: 'https://cdn.discordapp.com/avatars/123456789/abcdef1234567890.png',
    is_admin: true,
    user_metadata: {
      discord_id: '123456789',
      discord_username: 'CompleteUser',
      discord_avatar: 'https://cdn.discordapp.com/avatars/123456789/abcdef1234567890.png',
      is_admin: true,
      roles: ['admin', 'user']
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
    role: '',
  },
  noAvatar: {
    id: 'mock-user-2',
    email: 'noavatar@example.com',
    discord_id: '987654321',
    discord_username: 'NoAvatarUser',
    discord_avatar: '',
    is_admin: false,
    user_metadata: {
      discord_id: '987654321',
      discord_username: 'NoAvatarUser',
      discord_avatar: '',
      is_admin: false,
      roles: ['user']
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
    role: '',
  },
  avatarHash: {
    id: 'mock-user-3',
    email: 'avatarhash@example.com',
    discord_id: '456789123',
    discord_username: 'HashAvatarUser',
    discord_avatar: 'abcdef1234567890', // Just the hash, not a full URL
    is_admin: true,
    user_metadata: {
      discord_id: '456789123',
      discord_username: 'HashAvatarUser',
      discord_avatar: 'abcdef1234567890',
      is_admin: true,
      roles: ['admin', 'user']
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
    role: '',
  },
  noUsername: {
    id: 'mock-user-4',
    email: 'nousername@example.com',
    discord_id: '135792468',
    discord_username: '',
    discord_avatar: 'https://cdn.discordapp.com/avatars/135792468/abcdef1234567890.png',
    is_admin: false,
    user_metadata: {
      discord_id: '135792468',
      discord_username: '',
      discord_avatar: 'https://cdn.discordapp.com/avatars/135792468/abcdef1234567890.png',
      is_admin: false,
      roles: ['user']
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
    role: '',
  }
};


const UserProfileTest: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('complete');
  
  const mockUser = mockUsers[selectedUser];
  const isAdmin = selectedUser === 'complete' || selectedUser === 'avatarHash';
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">UserProfile Component Test</h1>
      
      <div className="mb-6 flex items-center space-x-4">
        <Switch 
          id="collapse-mode"
          checked={isCollapsed}
          onCheckedChange={setIsCollapsed}
        />
        <Label htmlFor="collapse-mode">
          {isCollapsed ? 'Collapsed Mode' : 'Expanded Mode'}
        </Label>
      </div>
      
      <Tabs defaultValue="complete" className="mb-6" onValueChange={setSelectedUser}>
        <TabsList>
          <TabsTrigger value="complete">Complete User</TabsTrigger>
          <TabsTrigger value="noAvatar">No Avatar</TabsTrigger>
          <TabsTrigger value="avatarHash">Avatar Hash</TabsTrigger>
          <TabsTrigger value="noUsername">No Username</TabsTrigger>
        </TabsList>
        
        <TabsContent value="complete" className="mt-2">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Complete User Data</h3>
            <p className="text-sm text-muted-foreground">User with complete profile data including avatar URL and admin status.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="noAvatar" className="mt-2">
          <Card className="p-4">
            <h3 className="font-medium mb-2">No Avatar User</h3>
            <p className="text-sm text-muted-foreground">User without an avatar image, testing the fallback avatar.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="avatarHash" className="mt-2">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Avatar Hash User</h3>
            <p className="text-sm text-muted-foreground">User with avatar hash instead of full URL, testing URL formatting.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="noUsername" className="mt-2">
          <Card className="p-4">
            <h3 className="font-medium mb-2">No Username User</h3>
            <p className="text-sm text-muted-foreground">User without a username, testing the fallback username handling.</p>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">UserProfile Component</h2>
          <div className={`bg-[#2f3136] ${isCollapsed ? 'w-[72px]' : 'w-[240px]'} p-2 rounded-md`}>
            {/* Use the test props to pass mock data */}
            <UserProfile 
              isCollapsed={isCollapsed} 
              testUser={mockUser}
              testIsAdmin={isAdmin}
            />
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Mock User Data</h2>
          <pre className="text-xs overflow-auto bg-slate-100 p-4 rounded-md max-h-[300px]">
            {JSON.stringify(mockUser, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileTest;
