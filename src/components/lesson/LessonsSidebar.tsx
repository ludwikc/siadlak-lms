
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, CheckCircle, FileText, Video, Headphones } from 'lucide-react';
import { lessonService } from '@/lib/supabase/services';
import type { Lesson, Module } from '@/lib/supabase/types';

interface LessonsSidebarProps {
  courseSlug: string;
  moduleSlug: string;
  currentLessonId: string;
  module: Module;
  lessons: Lesson[];
  completed: boolean;
}

const LessonsSidebar: React.FC<LessonsSidebarProps> = ({
  courseSlug,
  moduleSlug,
  currentLessonId,
  module,
  lessons: initialLessons,
  completed,
}) => {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons || []);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch lessons if they weren't provided or if the module has changed
  useEffect(() => {
    const fetchLessons = async () => {
      if (!module?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await lessonService.getLessonsByModuleId(module.id);
        
        if (error) {
          console.error('Error fetching lessons:', error);
          return;
        }
        
        if (data) {
          console.log('Fetched lessons for module:', module.title, data);
          setLessons(data);
        }
      } catch (error) {
        console.error('Error in lessons fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we don't have lessons already or if the module has changed
    if (!initialLessons || initialLessons.length === 0) {
      fetchLessons();
    }
  }, [module?.id, initialLessons]);
  
  // Sort lessons by order_index
  const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
  
  console.log('LessonsSidebar - Module:', module);
  console.log('LessonsSidebar - Lessons:', lessons);
  console.log('LessonsSidebar - Sorted Lessons:', sortedLessons);
  console.log('LessonsSidebar - Current Lesson ID:', currentLessonId);
  
  const getLessonIcon = (mediaType: string | null) => {
    switch (mediaType) {
      case 'video':
        return <Video size={14} />;
      case 'audio':
        return <Headphones size={14} />;
      default:
        return <FileText size={14} />;
    }
  };
  
  return (
    <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg">
      <div className="border-b border-discord-sidebar-bg p-4">
        <h3 className="font-semibold text-discord-header-text">Module Lessons</h3>
      </div>
      
      <div className="divide-y divide-discord-sidebar-bg max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-discord-secondary-text">
            Loading lessons...
          </div>
        ) : sortedLessons.length > 0 ? (
          sortedLessons.map((lesson, index) => {
            const isActive = lesson.id === currentLessonId;
            const isCompleted = completed && isActive;
            
            return (
              <Link
                key={lesson.id}
                to={`/courses/${courseSlug}/${moduleSlug}/${lesson.slug}`}
                className={`flex items-center p-4 transition-colors ${
                  isActive
                    ? 'bg-discord-sidebar-bg'
                    : 'hover:bg-discord-sidebar-bg/50'
                }`}
              >
                <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-discord-brand text-xs font-medium text-white">
                  {isCompleted ? <CheckCircle size={14} /> : index + 1}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    isActive ? 'text-discord-header-text' : 'text-discord-secondary-text'
                  }`}>
                    {lesson.title}
                  </h4>
                  <div className="flex items-center text-xs text-discord-secondary-text">
                    {getLessonIcon(lesson.media_type)}
                    <span className="ml-1">
                      {lesson.media_type === 'video' ? 'Video' : 
                       lesson.media_type === 'audio' ? 'Audio' : 'Text'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="p-4 text-center text-discord-secondary-text">
            No lessons available for this module.
          </div>
        )}
      </div>
      
      {module?.discord_thread_url && (
        <div className="border-t border-discord-sidebar-bg p-4">
          <a
            href={module.discord_thread_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-discord-secondary-text hover:text-discord-cta"
          >
            <Book size={18} />
            <span>Join Discord Discussion</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default LessonsSidebar;
