
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Info, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // Custom components for markdown rendering
  const components = {
    // Headers
    h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className={cn("mt-8 mb-4 text-3xl font-bold text-discord-header-text", className)} {...props} />
    ),
    h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className={cn("mt-6 mb-3 text-2xl font-semibold text-discord-header-text", className)} {...props} />
    ),
    h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className={cn("mt-5 mb-2 text-xl font-medium text-discord-header-text", className)} {...props} />
    ),
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className={cn("mt-4 mb-2 text-lg font-medium text-discord-header-text", className)} {...props} />
    ),
    
    // Paragraphs and text
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={cn("mb-4 text-discord-text leading-relaxed", className)} {...props} />
    ),
    strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className={cn("font-bold text-discord-header-text", className)} {...props} />
    ),
    em: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em className={cn("italic", className)} {...props} />
    ),
    
    // Lists
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className={cn("mb-4 list-disc pl-8", className)} {...props} />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className={cn("mb-4 list-decimal pl-8", className)} {...props} />
    ),
    li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className={cn("mb-1 text-discord-text", className)} {...props} />
    ),
    
    // Links and images
    a: ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a 
        className={cn("text-discord-brand hover:underline", className)} 
        target="_blank"
        rel="noopener noreferrer"
        {...props} 
      />
    ),
    img: ({ className, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img 
        className={cn("max-w-full h-auto rounded-md my-4 border border-discord-sidebar-bg", className)} 
        alt={alt || "Image"} 
        {...props} 
      />
    ),
    
    // Code blocks
    code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
      const isInline = !className?.includes('language-');
      return isInline ? (
        <code 
          className={cn("rounded bg-discord-deep-bg px-1 py-0.5 text-sm font-mono text-discord-header-text", className)} 
          {...props} 
        />
      ) : (
        <code 
          className={cn(
            "block rounded-md bg-discord-deep-bg p-4 text-sm font-mono text-discord-header-text overflow-x-auto",
            className
          )} 
          {...props} 
        />
      );
    },
    pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre 
        className={cn("mb-4 rounded-md bg-discord-deep-bg overflow-hidden", className)} 
        {...props} 
      />
    ),
    
    // Tables
    table: ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="mb-4 overflow-x-auto">
        <table 
          className={cn("w-full border-collapse rounded-md border border-discord-sidebar-bg", className)} 
          {...props} 
        />
      </div>
    ),
    thead: ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead 
        className={cn("bg-discord-sidebar-bg text-discord-header-text", className)} 
        {...props} 
      />
    ),
    tbody: ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody 
        className={cn("divide-y divide-discord-sidebar-bg", className)} 
        {...props} 
      />
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr 
        className={cn("border-b border-discord-sidebar-bg", className)} 
        {...props} 
      />
    ),
    th: ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th 
        className={cn("px-4 py-2 text-left font-medium", className)} 
        {...props} 
      />
    ),
    td: ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td 
        className={cn("px-4 py-2", className)} 
        {...props} 
      />
    ),
    
    // Blockquote
    blockquote: ({ className, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
      <blockquote 
        className={cn(
          "mb-4 border-l-4 border-discord-brand pl-4 italic text-discord-secondary-text",
          className
        )} 
        {...props} 
      />
    ),
    
    // Horizontal rule
    hr: ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
      <hr 
        className={cn("my-6 border-t border-discord-sidebar-bg", className)} 
        {...props} 
      />
    ),
  };

  // Process special markdown extensions before rendering
  // This is a basic implementation - a more robust solution would use proper parsing
  const processCustomBlocks = (content: string): string => {
    // Process callout boxes with format ::: info|warning|note|tip Content :::
    let processed = content.replace(
      /:::\s*(info|warning|note|tip)\s*\n([\s\S]*?)\n:::/g, 
      (_, type, content) => {
        return `<div class="callout callout-${type}">${content.trim()}</div>`;
      }
    );
    
    // Process collapsible sections with format ::: details Title Content :::
    processed = processed.replace(
      /:::\s*details\s*(.*?)\n([\s\S]*?)\n:::/g,
      (_, title, content) => {
        return `<div class="collapsible" data-title="${title.trim()}">${content.trim()}</div>`;
      }
    );
    
    // Process key concept highlighting with format ^[This is a key concept]
    processed = processed.replace(
      /\^\[([\s\S]*?)\]/g,
      (_, content) => {
        return `<span class="key-concept">${content.trim()}</span>`;
      }
    );
    
    return processed;
  };
  
  // Custom renderer for special elements created by our processor
  const isHtmlElement = (node: any): node is React.ReactElement => {
    return node && React.isValidElement(node) && typeof node.type === 'string';
  };
  
  const renderCustomNodes = (children: React.ReactNode): React.ReactNode => {
    if (!children) return children;
    
    if (typeof children === 'string') return children;
    
    if (Array.isArray(children)) {
      return children.map((child, i) => renderCustomNodes(child));
    }
    
    if (isHtmlElement(children)) {
      const { props, type } = children;
      
      // Handle callout boxes
      if (type === 'div' && props.className?.includes('callout-')) {
        const calloutType = props.className.replace('callout callout-', '');
        
        let icon;
        switch (calloutType) {
          case 'info':
            icon = <Info className="h-5 w-5 text-blue-400" />;
            break;
          case 'warning':
            icon = <AlertTriangle className="h-5 w-5 text-amber-400" />;
            break;
          case 'tip':
            icon = <CheckCircle className="h-5 w-5 text-green-400" />;
            break;
          case 'note':
            icon = <HelpCircle className="h-5 w-5 text-purple-400" />;
            break;
          default:
            icon = <Info className="h-5 w-5 text-blue-400" />;
        }
        
        return (
          <div className={`mb-4 rounded-md border border-discord-sidebar-bg bg-discord-deep-bg p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">{icon}</div>
              <div>{renderCustomNodes(props.children)}</div>
            </div>
          </div>
        );
      }
      
      // Handle collapsible sections
      if (type === 'div' && props.className === 'collapsible') {
        return (
          <Collapsible className="mb-4 rounded-md border border-discord-sidebar-bg overflow-hidden">
            <CollapsibleTrigger className="flex w-full items-center justify-between bg-discord-sidebar-bg px-4 py-2 text-discord-header-text hover:bg-opacity-90">
              <span>{props['data-title'] || 'Details'}</span>
              <ChevronRight className="h-4 w-4 transition-transform ui-expanded:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-3 bg-discord-deep-bg">
              {renderCustomNodes(props.children)}
            </CollapsibleContent>
          </Collapsible>
        );
      }
      
      // Handle key concept highlighting
      if (type === 'span' && props.className === 'key-concept') {
        return (
          <span className="inline-block rounded-md bg-discord-brand/10 px-1.5 py-0.5 text-discord-brand border-l-2 border-discord-brand">
            {renderCustomNodes(props.children)}
          </span>
        );
      }
      
      // Recursively process children of regular elements
      if (props.children) {
        return React.cloneElement(children, {
          ...props,
          children: renderCustomNodes(props.children)
        });
      }
    }
    
    return children;
  };

  const processedContent = processCustomBlocks(content);
  
  return (
    <div className={cn("prose prose-invert max-w-none", className)}>
      <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
