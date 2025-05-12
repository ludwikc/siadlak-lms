
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, CheckCircle, Video, Headphones, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Module, Course, Lesson } from '@/lib/supabase/types';
import { lessonService } from '@/lib/supabase/services';
import { useAuth } from '@/context/AuthContext';

interface ModulesListProps {
  course: Course;
  modules: Module[];
  isCollapsed: boolean;
  collapsedModules: string[];
  toggleModuleCollapse: (moduleId: string) => void;
}

export const ModulesList: React.FC<ModulesListProps> = ({ 
  course, 
  modules, 
  isCollapsed,
  collapsedModules,
  toggleModuleCollapse 
}) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});
  
  // Check which modules should be expanded based on the current route
  const currentPath = location.pathname;
  const isModuleActive = (moduleSlug: string) => currentPath.includes(`/courses/${course.slug}/${moduleSlug}`);
  
  // Auto-expand the module that matches the current route
  useEffect(() => {
    modules.forEach(module => {
      if (isModuleActive(module.slug) && collapsedModules.includes(module.id)) {
        toggleModuleCollapse(module.id);
      }
    });
  }, [modules, collapsedModules, location.pathname]);
  
  useEffect(() => {
    const fetchLessons = async () => {
      const lessonsMap: Record<string, Lesson[]> = {};
      
      // Only fetch lessons for expanded modules to save on API calls
      const expandedModules = modules.filter(m => !collapsedModules.includes(m.id));
      
      for (const module of expandedModules) {
        try {
          console.log(`Fetching lessons for module: ${module.title}`);
          const { data } = await lessonService.getLessonsByModuleId(module.id);
          if (data) {
            console.log(`Found ${data.length} lessons for module: ${module.title}`);
            lessonsMap[module.id] = data;
          } else {
            console.log(`No lessons found for module: ${module.title}`);
          }
        } catch (error) {
          console.error(`Error fetching lessons for module ${module.id}:`, error);
        }
      }
      
      setModuleLessons(lessonsMap);
    };
    
    if (modules.length > 0) {
      fetchLessons();
    }
  }, [modules, collapsedModules]);
  
  const getLessonIcon = (mediaType: string | null) => {
    switch (mediaType) {
      case 'video':
        return <Video size={16} className="mr-1.5 flex-shrink-0" />;
      case 'audio':
        return <Headphones size={16} className="mr-1.5 flex-shrink-0" />;
      default:
        return <FileText size={16} className="mr-1.5 flex-shrink-0" />;
    }
  };
  
  console.log('ModulesList - Course:', course.title);
  console.log('ModulesList - Modules:', modules);
  console.log('ModulesList - Module Lessons:', moduleLessons);
  console.log('ModulesList - Collapsed modules:', collapsedModules);

  // Sort modules by order_index
  const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index);
  
  if (sortedModules.length === 0) {
    return <div className="px-2 py-1.5 text-sm text-[#8e9297]">No modules available</div>;
  }
  
  return (
    <div className="px-1">
      {sortedModules.map((module) => {
          const isActive = isModuleActive(module.slug);
          const isExpanded = !collapsedModules.includes(module.id);
          
          return (
            <Collapsible 
              key={module.id} 
              open={isExpanded}
              onOpenChange={() => toggleModuleCollapse(module.id)}
              className="mb-2"
            >
              <CollapsibleTrigger className={cn(
                "w-full text-left flex items-center px-2 py-1.5 text-xs uppercase tracking-wide font-semibold",
                isCollapsed ? "justify-center" : "justify-between",
                isActive ? "text-white" : "text-[#8e9297] hover:text-white"
              )}>
                {!isCollapsed && (
                  <>
                    <span className="truncate">{module.title}</span>
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </>
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className={cn(
                isCollapsed && "hidden"
              )}>
                <div className="pl-2 pr-1">
                  {isExpanded && moduleLessons[module.id]?.length > 0 ? (
                    moduleLessons[module.id]
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((lesson) => {
                        // Create path for this lesson
                        const lessonPath = `/courses/${course.slug}/${module.slug}/${lesson.slug}`;
                        const isActive = location.pathname === lessonPath;
                        
                        return (
                          <Link
                            key={lesson.id}
                            to={lessonPath}
                            className={cn(
                              "flex items-center px-2 py-1.5 text-sm rounded transition-colors",
                              isActive 
                                ? "bg-[#393c43] text-white" 
                                : "hover:bg-[#36393f] text-[#8e9297] hover:text-white"
                            )}
                          >
                            {getLessonIcon(lesson.media_type)}
                            <span className="truncate">
                              {`${module.order_index + 1}.${lesson.order_index + 1} ${lesson.title}`}
                            </span>
                          </Link>
                        );
                      })
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-[#8e9297]">
                      {isExpanded 
                        ? "Loading lessons..." 
                        : "Module collapsed"}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
    </div>
  );
};
