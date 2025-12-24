import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }> = ({ 
  children, variant = 'primary', size = 'md', className = '', ...props 
}) => {
  const base = "font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 rounded-xl",
    lg: "px-6 py-3 text-lg rounded-xl"
  };

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-500/30 dark:bg-indigo-600 dark:hover:bg-indigo-500 border border-transparent",
    secondary: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-red-500/30 dark:bg-red-600 dark:hover:bg-red-700 border border-transparent",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
  };

  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
    <input 
      className={`
        w-full
        border border-gray-200 dark:border-gray-700 
        rounded-xl px-4 py-2.5 h-[48px]
        bg-white dark:bg-gray-800 
        text-gray-900 dark:text-white 
        placeholder-gray-400 dark:placeholder-gray-500 
        transition-all duration-200
        focus:border-indigo-500 dark:focus:border-indigo-500
        focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20
        focus:outline-none
        hover:border-gray-300 dark:hover:border-gray-600
        disabled:bg-gray-50 dark:disabled:bg-gray-900/50 disabled:text-gray-500
        /* Ensure date picker matches theme */
        dark:[color-scheme:dark] [color-scheme:light]
        ${className}
      `} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: string[] }> = ({ label, options, className = '', children, ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
    <div className="relative group">
      <select 
        className={`
          w-full appearance-none 
          border border-gray-200 dark:border-gray-700 
          rounded-xl px-4 py-2.5 h-[48px]
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-white 
          pr-10 cursor-pointer
          transition-all duration-200
          focus:border-indigo-500 dark:focus:border-indigo-500
          focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20
          focus:outline-none
          hover:border-gray-300 dark:hover:border-gray-600
          ${className}
        `} 
        {...props}
      >
        <option value="" className="text-gray-400">Select...</option>
        {options.length > 0 ? options.map(opt => <option key={opt} value={opt}>{opt}</option>) : children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        <ChevronDown size={18} strokeWidth={2.5} />
      </div>
    </div>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, title?: string, className?: string, action?: React.ReactNode }> = ({ children, title, className = '', action }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md ${className}`}>
    {(title || action) && (
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl bg-gray-50/50 dark:bg-gray-800/50">
        {title && <h3 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronDown size={24} className="rotate-180" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 rounded-b-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};