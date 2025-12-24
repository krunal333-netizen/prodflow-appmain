
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  noHeaderBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, title, className, action, noPadding, noHeaderBorder }) => {
  return (
    <div className={cn(
      "bg-white dark:bg-neutral-800 rounded-xl shadow-cardLight dark:shadow-cardDark border border-neutral-200/50 dark:border-neutral-700/50 transition-all duration-page hover:shadow-lg overflow-hidden",
      className
    )}>
      {(title || action) && (
        <div className={cn(
          "px-6 py-5 flex items-center justify-between",
          !noHeaderBorder && "border-b border-neutral-100 dark:border-neutral-700"
        )}>
          {title && <h3 className="typography-label-xs text-neutral-400 dark:text-neutral-500 font-black">{title}</h3>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn(noPadding ? "" : "p-6")}>
        {children}
      </div>
    </div>
  );
};
