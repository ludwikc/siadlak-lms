
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MoveVertical } from 'lucide-react';
import { moduleService, lessonService } from '@/lib/supabase/services';
import type { Module, Lesson } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const AdminModuleEditPage: React.FC = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!moduleId;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [module, setModule] = useState<Partial<Module>>({
    title: '',
    slug: '',
    course_id: courseId || '',
    discord_thread_url: '',
    order_index: 0
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        
        // If editing, fetch the module
        if (isEditing && moduleId) {
          const { data, error } = await moduleService.getModuleById(moduleId);
          
          if (error) throw error;
          if (!data) throw new Error('Module not found');
          
          setModule(data);
          
          // Fetch lessons for this module
          const { data: lessonData, error: lessonError } = await lessonService.getLessonsByModuleId(moduleId);
          
          if (lessonError) throw lessonError;
          setLessons(lessonData || []);
        } else {
          // For new modules, set the next order index
          const { data: modules } = await moduleService.getModulesByCourseId(courseId);
          const highestIndex = modules && modules.length > 0
            ? Math.max(...modules.map(m => m.order_index))
            : -1;
          
          setModule(prev => ({ ...prev, order_index: highestIndex + 1 }));
        }
      } catch (err) {
        console.error('Error fetching module data:', err);
        setError('Failed to load module data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, moduleId, isEditing]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModule(prev => ({ ...prev, [name]: value }));
  };
  
  const generateSlug = () => {
    if (!module.title) return;
    
    const slug = module.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    setModule(prev => ({ ...prev, slug }));
  };
  
  const handleSave = async () => {
    if (!courseId || !module.title || !module.slug) {
      setError('Title and slug are required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (isEditing && moduleId) {
        const { error } = await moduleService.updateModule(moduleId, {
          title: module.title,
          slug: module.slug,
          discord_thread_url: module.discord_thread_url || null,
        });
        
        if (error) throw error;
        toast.success('Module updated successfully');
      } else {
        const { error } = await moduleService.createModule(module as Omit<Module, 'id' | 'created_at' | 'updated_at'>);
        
        if (error) throw error;
        toast.success('Module created successfully');
      }
      
      navigate(`/admin/courses/${courseId}`);
    } catch (err) {
      console.error('Error saving module:', err);
      setError('Failed to save module. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddLesson = () => {
    navigate(`/admin/courses/${courseId}/modules/${moduleId}/lessons/new`);
  };
  
  const handleEditLesson = (lessonId: string) => {
    navigate(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/admin/courses/${courseId}`)}
          className="rounded-md p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-discord-header-text">
          {isEditing ? 'Edit Module' : 'Create New Module'}
        </h1>
      </header>
      
      {error && (
        <div className="rounded-md bg-red-500/10 p-4 text-red-500">
          {error}
        </div>
      )}
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          {isEditing && <TabsTrigger value="lessons">Lessons</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={module.title}
                  onChange={handleInputChange}
                  placeholder="Enter module title"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">URL Slug</Label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-xs text-discord-secondary-text hover:text-discord-text"
                  >
                    Generate from title
                  </button>
                </div>
                <Input
                  id="slug"
                  name="slug"
                  value={module.slug}
                  onChange={handleInputChange}
                  placeholder="enter-url-slug"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discord_thread_url">Discord Thread URL (Optional)</Label>
                <Input
                  id="discord_thread_url"
                  name="discord_thread_url"
                  value={module.discord_thread_url || ''}
                  onChange={handleInputChange}
                  placeholder="https://discord.com/channels/..."
                />
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/courses/${courseId}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Module'}
            </Button>
          </div>
        </TabsContent>
        
        {isEditing && (
          <TabsContent value="lessons" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-discord-header-text">Module Lessons</h2>
              <Button onClick={handleAddLesson} className="bg-discord-brand hover:bg-discord-brand/90">
                <Plus className="mr-2 h-4 w-4" /> Add Lesson
              </Button>
            </div>
            
            {lessons.length === 0 ? (
              <div className="text-center py-8 text-discord-secondary-text">
                <p>No lessons added to this module yet.</p>
                <p>Click the button above to add your first lesson.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.sort((a, b) => a.order_index - b.order_index).map((lesson) => (
                  <Card key={lesson.id} className="bg-discord-deep-bg border-discord-sidebar-bg">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-discord-sidebar-bg text-discord-secondary-text">
                          {lesson.order_index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-discord-header-text">{lesson.title}</h3>
                          <p className="text-sm text-discord-secondary-text">
                            {lesson.media_type || 'text'} • {lesson.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {}} 
                          className="text-discord-secondary-text"
                        >
                          <MoveVertical className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditLesson(lesson.id)} 
                          className="text-discord-secondary-text"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {}} 
                          className="text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminModuleEditPage;
