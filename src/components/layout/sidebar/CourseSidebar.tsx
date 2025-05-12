
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/components/ui/accordion';
import { Course, Module, Lesson } from '@/lib/supabase/types';
import { lessonService } from '@/lib/supabase/services';
import { useProgress } from '@/context/ProgressContext';

interface CourseSidebarProps {
  course: Course;
  hasAccess: boolean;
  progress: number;
  modules?: Module[]; // Accept modules from parent
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ 
  course, 
  hasAccess,
  progress,
  modules = []
}) => {
  const location = useLocation();
  const { coursesProgress } = useProgress();
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  
  // Fetch lessons when the course is expanded
  useEffect(() => {
    const fetchLessons = async () => {
      if (hasAccess && expanded && modules.length > 0) {
        try {
          setLoading(true);
          
          // Get lessons for each module
          const lessonPromises = modules.map(module => 
            lessonService.getLessonsByModuleId(module.id)
          );
          
          const lessonResults = await Promise.all(lessonPromises);
          
          // Organize lessons by module ID
          const lessonsByModule: Record<string, Lesson[]> = {};
          lessonResults.forEach((result, index) => {
            if (result.data) {
              lessonsByModule[modules[index].id] = result.data;
            }
          });
          
          setLessons(lessonsByModule);
        } catch (error) {
          console.error(`Error fetching lessons for course ${course.title}:`, error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchLessons();
  }, [course.id, hasAccess, expanded, modules]);
  
  // Get completed lessons from progress context
  useEffect(() => {
    if (hasAccess) {
      const courseProgress = coursesProgress.find(cp => cp.course.id === course.id);
      if (courseProgress?.progress) {
        const completedLessonsSet = new Set<string>();
        courseProgress.progress.forEach(progressItem => {
          if (progressItem.completed) {
            completedLessonsSet.add(progressItem.lesson_id);
          }
        });
        setCompletedLessons(completedLessonsSet);
      }
    }
  }, [course.id, hasAccess, coursesProgress]);

  const toggleExpanded = () => {
    if (hasAccess) {
      setExpanded(!expanded);
    }
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  // Sort modules by order_index
  const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className={cn(
      "px-1",
      !hasAccess && "opacity-60"
    )}>
      <button 
        onClick={toggleExpanded}
        className={cn(
          "w-full flex items-center justify-between px-2 py-2 rounded text-left hover:bg-[#36393f]",
          isActive(`/courses/${course.slug}`) && "bg-[#36393f]"
        )}
      >
        <div className="flex items-center">
          {!hasAccess && <Lock className="h-4 w-4 mr-2 text-gray-400" />}
          <span className="font-medium truncate">{course.title}</span>
        </div>
        {hasAccess && (
          <div className="flex items-center">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </button>

      {hasAccess && expanded && (
        <div className="ml-2 pl-2 border-l border-[#1f2225]">
          {loading ? (
            <div className="py-2 px-2 text-sm">Loading modules...</div>
          ) : sortedModules.length > 0 ? (
            <Accordion 
              type="multiple" 
              className="w-full"
              defaultValue={sortedModules.map(m => m.id)}
            >
              {sortedModules.map(module => (
                <AccordionItem 
                  key={module.id} 
                  value={module.id}
                  className="border-b-0"
                >
                  <AccordionTrigger className="py-2 hover:bg-[#36393f] rounded px-2 text-sm">
                    {module.title}
                  </AccordionTrigger>
                  <AccordionContent className="pl-4">
                    {lessons[module.id]?.map(lesson => {
                      const isCompleted = completedLessons.has(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          to={`/courses/${course.slug}/${module.slug}/${lesson.slug}`}
                          className={cn(
                            "flex items-center py-1 px-2 text-sm rounded hover:bg-[#36393f]",
                            isActive(`/courses/${course.slug}/${module.slug}/${lesson.slug}`) && "bg-[#36393f]",
                          )}
                        >
                          <div className="mr-2 flex items-center justify-center">
                            {isCompleted ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-gray-400" />
                            )}
                          </div>
                          <span className="truncate">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-2 px-2 text-sm">No modules available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSidebar;
