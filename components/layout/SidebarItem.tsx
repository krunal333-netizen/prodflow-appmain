
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 transition-all duration-state group border-l-4",
        active 
          ? "bg-primary/5 border-primary text-primary animate-pillSlideIn" 
          : "border-transparent text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
      )}
    >
      <Icon 
        size={22} 
        className={cn(
          "transition-colors",
          active ? "text-primary" : "text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
        )}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className={cn(
        "text-base font-bold font-display",
        active ? "text-primary" : "text-neutral-400"
      )}>
        {label}
      </span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </button>
  );
};
