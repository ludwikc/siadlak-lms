import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, ChevronDown, MoveVertical, Trash2, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moduleService, lessonService } from '@/lib/supabase/services';
import type { Module, Lesson } from '@/lib/supabase/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface CourseModulesListProps {
  courseId: string;
}

const CourseModulesList: React.FC<CourseModulesListProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});
  
  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await moduleService.getModulesByCourseId(courseId);
      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }
      if (data) {
        setModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchLessons = async (moduleId: string) => {
    try {
      const { data } = await lessonService.getLessonsByModuleId(moduleId);
      if (data) {
        setModuleLessons(prev => ({ ...prev, [moduleId]: data }));
      }
    } catch (error) {
      console.error(`Error fetching lessons for module ${moduleId}:`, error);
    }
  };
  
  useEffect(() => {
    if (courseId) {
      fetchModules();
    }
  }, [courseId]);
  
  const handleToggleModule = (moduleId: string) => {
    if (expandedModules.includes(moduleId)) {
      setExpandedModules(expandedModules.filter(id => id !== moduleId));
    } else {
      setExpandedModules([...expandedModules, moduleId]);
      // Fetch lessons if we're expanding and don't already have them
      if (!moduleLessons[moduleId]) {
        fetchLessons(moduleId);
      }
    }
  };
  
  const handleAddModule = () => {
    navigate(`/admin/courses/${courseId}/modules/new`);
  };
  
  const handleEditModule = (moduleId: string) => {
    navigate(`/admin/courses/${courseId}/modules/${moduleId}`);
  };
  
  const handleDeleteModule = async (moduleId: string) => {
    // Implement delete logic with confirmation
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await moduleService.deleteModule(moduleId);
      if (error) throw error;
      
      toast.success('Module deleted successfully');
      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };
  
  const handleAddLesson = (moduleId: string) => {
    navigate(`/admin/courses/${courseId}/modules/${moduleId}/lessons/new`);
  };
  
  const handleEditLesson = (moduleId: string, lessonId: string) => {
    navigate(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-discord-header-text">Course Modules</CardTitle>
        <Button onClick={handleAddModule} className="bg-discord-brand hover:bg-discord-brand/90">
          <Plus className="mr-2 h-4 w-4" /> Add Module
        </Button>
      </CardHeader>
      
      <CardContent className="pt-4">
        {modules.length === 0 ? (
          <div className="text-center py-8 text-discord-secondary-text">
            <p>No modules added to this course yet.</p>
            <p>Click the button above to add your first module.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules
              .sort((a, b) => a.order_index - b.order_index)
              .map((module) => (
                <Card key={module.id} className="border-discord-sidebar-bg overflow-hidden">
                  <Collapsible 
                    open={expandedModules.includes(module.id)} 
                    onOpenChange={() => handleToggleModule(module.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 text-left border-b border-discord-sidebar-bg">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-discord-sidebar-bg text-discord-secondary-text">
                            {module.order_index + 1}
                          </div>
                          <h3 className="font-medium text-discord-header-text">{module.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditModule(module.id);
                            }}
                            className="text-discord-secondary-text hover:text-discord-text"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModule(module.id);
                            }}
                            className="text-red-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {expandedModules.includes(module.id) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="p-4 pt-0 space-y-2">
                        <div className="flex justify-between items-center py-4">
                          <h4 className="text-sm font-medium text-discord-secondary-text">Lessons</h4>
                          <Button 
                            size="sm"
                            onClick={() => handleAddLesson(module.id)}
                            className="bg-discord-brand hover:bg-discord-brand/90 text-xs"
                          >
                            <Plus className="mr-1 h-3 w-3" /> Add Lesson
                          </Button>
                        </div>
                        
                        {moduleLessons[module.id] && moduleLessons[module.id].length > 0 ? (
                          <div className="space-y-1">
                            {moduleLessons[module.id]
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((lesson) => (
                                <div 
                                  key={lesson.id}
                                  className="flex items-center justify-between p-2 rounded hover:bg-discord-sidebar-bg"
                                >
                                  <div className="flex items-center gap-2">
                                    <File className="h-4 w-4 text-discord-secondary-text" />
                                    <span className="text-sm">{lesson.title}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditLesson(module.id, lesson.id)}
                                    className="text-discord-secondary-text h-8 p-2"
                                  >
                                    Edit
                                  </Button>
                                </div>
                              ))
                            }
                          </div>
                        ) : (
                          <div className="text-center py-4 text-discord-secondary-text">
                            <p className="text-sm">No lessons in this module yet</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseModulesList;
