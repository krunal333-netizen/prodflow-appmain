
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({ children, onClick, selected, className }) => {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "group transition-all duration-state border-b border-neutral-100 dark:border-neutral-700 last:border-none",
        onClick && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900",
        selected && "bg-primary/5 dark:bg-primary/10",
        className
      )}
    >
      {children}
    </tr>
  );
};
