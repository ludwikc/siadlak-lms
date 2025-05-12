
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
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
import { ModulesList } from './ModulesList';

interface CourseSidebarProps {
  course: Course;
  hasAccess: boolean;
  progress: number;
  modules: Module[]; // Required modules list
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ 
  course, 
  hasAccess,
  progress,
  modules
}) => {
  const location = useLocation();
  const { coursesProgress } = useProgress();
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  
  // Fetch lessons when the course is expanded
  useEffect(() => {
    const fetchLessons = async () => {
      if (hasAccess && expanded && modules.length > 0) {
        try {
          setLoading(true);
          console.log(`Fetching lessons for ${modules.length} modules in course: ${course.title}`);
          
          // Get lessons for each module
          const lessonPromises = modules.map(module => 
            lessonService.getLessonsByModuleId(module.id)
          );
          
          const lessonResults = await Promise.all(lessonPromises);
          
          // Organize lessons by module ID
          const lessonsByModule: Record<string, Lesson[]> = {};
          lessonResults.forEach((result, index) => {
            if (result.data) {
              console.log(`Found ${result.data.length} lessons for module: ${modules[index].title}`);
              lessonsByModule[modules[index].id] = result.data;
            } else {
              console.log(`No lessons for module: ${modules[index].title}`);
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

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  console.log('CourseSidebar - Course:', course.title);
  console.log('CourseSidebar - Modules:', modules);
  console.log('CourseSidebar - Lessons:', lessons);

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
        <ModulesList
          course={course}
          modules={modules}
          isCollapsed={false}
          collapsedModules={collapsedModules}
          toggleModuleCollapse={toggleModuleCollapse}
        />
      )}
    </div>
  );
};

export default CourseSidebar;
