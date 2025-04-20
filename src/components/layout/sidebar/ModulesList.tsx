
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, ChevronDown, ChevronRight, Hash, Mic } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Module, Course } from '@/lib/supabase/types';

interface ModulesListProps {
  course: Course;
  modules: Module[];
  isCollapsed: boolean;
  collapsedModules: string[];
  toggleModuleCollapse: (moduleId: string) => Promise<void>;
}

export const ModulesList: React.FC<ModulesListProps> = ({
  course,
  modules,
  isCollapsed,
  collapsedModules,
  toggleModuleCollapse,
}) => {
  return (
    <div className="px-1">
      {modules.map((module) => (
        <Collapsible 
          key={module.id} 
          open={!collapsedModules.includes(module.id)}
          onOpenChange={() => toggleModuleCollapse(module.id)}
          className="mb-2"
        >
          <CollapsibleTrigger className={cn(
            "w-full text-left flex items-center px-2 py-1.5 text-xs uppercase tracking-wide font-semibold",
            isCollapsed ? "justify-center" : "justify-between",
            "hover:text-white"
          )}>
            {!isCollapsed && (
              <>
                <span className="truncate">{module.title}</span>
                {collapsedModules.includes(module.id) ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </>
            )}
            {isCollapsed && <Book size={16} />}
          </CollapsibleTrigger>
          
          <CollapsibleContent className={cn(
            isCollapsed && "hidden"
          )}>
            <div className="pl-2 pr-1">
              <Link
                to={`/courses/${course.slug}/modules/${module.slug}`}
                className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-[#36393f] text-[#8e9297] hover:text-white group transition-colors"
              >
                <Hash size={16} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{`${module.order_index}.1 - first-lesson`}</span>
              </Link>
              
              <Link
                to={`/courses/${course.slug}/modules/${module.slug}`}
                className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-[#36393f] text-[#8e9297] hover:text-white group transition-colors"
              >
                <Hash size={16} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{`${module.order_index}.2 - second-lesson`}</span>
              </Link>
              
              <Link
                to={`/courses/${course.slug}/modules/${module.slug}`}
                className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-[#36393f] text-white bg-[#393c43] group transition-colors"
              >
                <Mic size={16} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{`${module.order_index}.3 - video-lesson`}</span>
              </Link>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};
