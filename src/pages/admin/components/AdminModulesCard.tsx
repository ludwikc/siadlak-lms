
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  courseId: string;
};

const AdminModulesCard: React.FC<Props> = ({ courseId }) => {
  const navigate = useNavigate();
  return (
    <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
      <CardHeader>
        <CardTitle className="text-discord-header-text">Modules</CardTitle>
        <CardDescription className="text-discord-secondary-text">
          Course content organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-discord-secondary-text">
            Add and manage modules for this course
          </p>
          <Button
            onClick={() => navigate(`/admin/courses/${courseId}/modules/new`)}
            className="w-full bg-discord-brand text-white hover:bg-discord-brand/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminModulesCard;
