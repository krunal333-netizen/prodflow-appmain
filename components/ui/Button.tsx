
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-state outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:animate-btnPress overflow-hidden select-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-primaryGlow",
    ghost: "bg-transparent text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white",
    secondary: "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm",
    danger: "bg-danger text-white hover:bg-red-600 shadow-lg shadow-danger/20",
  };

  const sizes = {
    sm: "h-9 px-4 py-2 text-xs rounded-sm",
    md: "h-[50px] px-6 py-3 text-sm rounded-md",
    lg: "h-14 px-8 py-4 text-base rounded-lg",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="animate-pulse">Loading...</span>
        </span>
      ) : children}
    </button>
  );
};
