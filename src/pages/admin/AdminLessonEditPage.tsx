
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lessonService, moduleService } from '@/lib/supabase/services';
import type { Lesson } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import MediaBrowser from '@/components/admin/MediaBrowser';
import MarkdownRenderer from '@/components/content/MarkdownRenderer';
import ContentDisplay from '@/components/content/ContentDisplay';

const AdminLessonEditPage: React.FC = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!lessonId;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lesson, setLesson] = useState<Partial<Lesson>>({
    title: '',
    slug: '',
    content: '',
    module_id: moduleId || '',
    media_type: 'text',
    media_url: '',
    transcript: '',
    order_index: 0,
    published: false
  });
  
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId || !moduleId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await lessonService.getLessonById(lessonId);
        
        if (error) throw error;
        if (!data) throw new Error('Lesson not found');
        
        setLesson(data);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Failed to load lesson. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isEditing) {
      fetchLesson();
    }
  }, [lessonId, moduleId, isEditing]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLesson(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setLesson(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setLesson(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleMediaSelect = (url: string) => {
    setLesson(prev => ({ ...prev, media_url: url }));
  };
  
  const generateSlug = () => {
    if (!lesson.title) return;
    
    const slug = lesson.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    setLesson(prev => ({ ...prev, slug }));
  };
  
  const handleSave = async () => {
    if (!moduleId || !lesson.title || !lesson.content) {
      setError('Title and content are required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Generate slug if not provided
      if (!lesson.slug) {
        generateSlug();
      }
      
      if (isEditing && lessonId) {
        const { error } = await lessonService.updateLesson(lessonId, lesson);
        if (error) throw error;
      } else {
        // Get current highest order index for the module
        const { data: moduleLessons } = await lessonService.getLessonsByModuleId(moduleId);
        const highestIndex = moduleLessons && moduleLessons.length > 0
          ? Math.max(...moduleLessons.map(l => l.order_index))
          : -1;
        
        const newLesson = {
          ...lesson,
          module_id: moduleId,
          order_index: highestIndex + 1
        };
        
        const { error } = await lessonService.createLesson(newLesson as Omit<Lesson, 'id' | 'created_at' | 'updated_at'>);
        if (error) throw error;
      }
      
      // Navigate back to module page
      navigate(`/admin/courses/${courseId}/modules/${moduleId}`);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError('Failed to save lesson. Please try again later.');
    } finally {
      setIsSaving(false);
    }
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
          onClick={() => navigate(`/admin/courses/${courseId}/modules/${moduleId}`)}
          className="rounded-md p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-discord-header-text">
          {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
        </h1>
      </header>
      
      {error && (
        <div className="rounded-md bg-red-500/10 p-4 text-red-500">
          {error}
        </div>
      )}
      
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input
                id="title"
                name="title"
                value={lesson.title}
                onChange={handleInputChange}
                placeholder="Enter lesson title"
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
                value={lesson.slug}
                onChange={handleInputChange}
                placeholder="enter-url-slug"
              />
            </div>
          </div>
          
          {/* Media Settings */}
          <div className="space-y-4 rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6">
            <h2 className="text-lg font-semibold text-discord-header-text">Media Settings</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="media_type">Media Type</Label>
                <Select
                  value={lesson.media_type}
                  onValueChange={(value) => handleSelectChange('media_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Only</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {lesson.media_type !== 'text' && (
                <div className="space-y-2">
                  <Label>Media URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      name="media_url"
                      value={lesson.media_url}
                      onChange={handleInputChange}
                      placeholder="Enter media URL or use browser"
                      className="flex-1"
                    />
                    <MediaBrowser 
                      onSelectMedia={handleMediaSelect}
                      defaultValue={lesson.media_url}
                      allowedTypes={[lesson.media_type as 'video' | 'audio']}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Media Preview */}
            {lesson.media_type !== 'text' && lesson.media_url && (
              <div className="mt-4">
                <Label className="mb-2 block">Media Preview</Label>
                <div className="rounded-md border border-discord-sidebar-bg overflow-hidden">
                  <div className={lesson.media_type === 'video' ? "aspect-video" : ""}>
                    <iframe
                      src={lesson.media_url}
                      title={lesson.title || 'Preview'}
                      className="h-full w-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Lesson Content (Markdown)</Label>
            <Textarea
              id="content"
              name="content"
              value={lesson.content}
              onChange={handleInputChange}
              placeholder="Write lesson content using Markdown..."
              className="min-h-[300px] font-mono"
            />
          </div>
          
          {/* Transcript */}
          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript/Summary (Optional)</Label>
            <Textarea
              id="transcript"
              name="transcript"
              value={lesson.transcript || ''}
              onChange={handleInputChange}
              placeholder="Add a transcript or summary for this lesson..."
              className="min-h-[200px]"
            />
          </div>
          
          {/* Publishing Options */}
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={lesson.published}
              onCheckedChange={(checked) => handleSwitchChange('published', checked)}
            />
            <Label htmlFor="published">Published</Label>
          </div>
          
          {/* Save Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/courses/${courseId}/modules/${moduleId}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Lesson'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6">
            <ContentDisplay
              title={lesson.title || 'Lesson Title'}
              mediaUrl={lesson.media_url || undefined}
              mediaType={lesson.media_type as 'video' | 'audio' | 'text'}
              content={lesson.content || '*No content provided yet*'}
              transcript={lesson.transcript || undefined}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLessonEditPage;
