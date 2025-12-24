
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-pill text-[10px] font-black uppercase tracking-widest border transition-all duration-state select-none whitespace-nowrap active:scale-95",
        active 
          ? "bg-primary border-primary text-white shadow-md shadow-primary/20 animate-chipHalo" 
          : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-primary/40 hover:text-primary dark:hover:text-white",
        className
      )}
    >
      {label}
    </button>
  );
};
