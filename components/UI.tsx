
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, ChevronLeft, ChevronRight, X, Check, Search, LucideIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Option {
  label: string;
  value: string | number;
}

// --- Helper Functions for Date Picker ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// --- Custom Date Picker Component ---
const DatePicker: React.FC<{ value: string; onChange: (val: string) => void; className?: string; disabled?: boolean }> = ({ value, onChange, className, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState({ year: initialDate.getFullYear(), month: initialDate.getMonth() });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (day: number) => {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    let newMonth = viewDate.month + delta;
    let newYear = viewDate.year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setViewDate({ year: newYear, month: newMonth });
  };

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const startDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const formattedValueDisplay = value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date';

  return (
    <div className={cn("relative w-full", className, isOpen ? "z-[100]" : "z-auto")} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg px-4 py-3 h-[50px] transition-all duration-state group outline-none",
          "bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60",
          "text-neutral-900 dark:text-white font-bold",
          "hover:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <span className={cn("truncate mr-2", !value && "text-neutral-400 font-medium")}>{formattedValueDisplay}</span>
        <Calendar size={18} className="text-neutral-400 group-hover:text-primary transition-colors shrink-0" strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute z-[999] mt-2 p-5 bg-white dark:bg-neutral-800 rounded-xl shadow-cardLight dark:shadow-cardDark border border-neutral-200 dark:border-neutral-700 w-[320px] animate-in fade-in zoom-in-95 duration-200 left-0 md:left-auto md:right-0">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-400 dark:text-neutral-500 transition-all active:scale-90"><ChevronLeft size={18} strokeWidth={2.5}/></button>
            <span className="font-black text-neutral-900 dark:text-white text-xs uppercase tracking-[0.15em]">{MONTH_NAMES[viewDate.month]} {viewDate.year}</span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-400 dark:text-neutral-500 transition-all active:scale-90"><ChevronRight size={18} strokeWidth={2.5}/></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-3">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-black text-neutral-300 dark:text-neutral-600 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const isSelected = value && new Date(value).getDate() === day && new Date(value).getMonth() === viewDate.month && new Date(value).getFullYear() === viewDate.year;
              const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.month && new Date().getFullYear() === viewDate.year;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-9 w-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-micro",
                    isSelected 
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60",
                    !isSelected && isToday && "text-primary ring-1 ring-inset ring-primary/30"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Custom Select Component ---
export const CustomSelect: React.FC<{
  label?: string;
  value: string | number;
  onChange: (val: string) => void;
  options: (Option | string)[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}> = ({ label, value, onChange, options, placeholder = 'Select...', className = '', disabled, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');

  const normalizedOptions: Option[] = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));
  const filteredOptions = normalizedOptions.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string | number) => {
    onChange(String(val));
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={cn("flex flex-col gap-1.5 w-full transition-all duration-state", className, isOpen ? "relative z-[150]" : "relative z-[1]")} ref={containerRef}>
      {label && <label className="typography-label-xs text-neutral-400 ml-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg px-4 py-3 h-[50px] transition-all duration-state group outline-none",
            "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
            "text-neutral-900 dark:text-white font-bold",
            Icon && "pl-11",
            isOpen ? "border-primary ring-4 ring-primary/5 shadow-md" : "hover:border-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {Icon && (
            <Icon 
              size={18} 
              className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", isOpen ? "text-primary" : "text-neutral-400 group-hover:text-primary")} 
              strokeWidth={2.5}
            />
          )}
          <span className={cn("truncate mr-2", !selectedOption && "text-neutral-400 font-medium")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={18} className={cn("text-neutral-400 transition-transform duration-state shrink-0", isOpen && "rotate-180 text-primary")} strokeWidth={2.5} />
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-neutral-800 rounded-xl shadow-cardLight dark:shadow-cardDark border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[220px] z-[999]">
            {normalizedOptions.length > 5 && (
              <div className="p-3 border-b border-neutral-100 dark:border-neutral-700">
                 <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
                    <input 
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-900 rounded-lg border-none focus:ring-2 focus:ring-primary/15 outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 font-bold"
                      placeholder="Search options..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                 </div>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg text-xs flex items-center justify-between transition-all mb-0.5 last:mb-0",
                      String(value) === String(opt.value) 
                        ? "bg-primary/5 text-primary font-black" 
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 hover:translate-x-1"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {String(value) === String(opt.value) && <Check size={14} className="shrink-0 text-primary" strokeWidth={3} />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-xs text-neutral-400 font-bold text-center italic opacity-60">No matching results</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Exports ---

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }> = ({ 
  children, variant = 'primary', size = 'md', className = '', ...props 
}) => {
  const base = "font-bold transition-all duration-state flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] overflow-hidden select-none";
  
  const sizes = {
    sm: "px-4 py-2 text-xs rounded-md",
    md: "px-6 py-3 text-sm rounded-lg h-[50px]",
    lg: "px-8 py-4 text-base rounded-xl"
  };

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-primaryGlow",
    secondary: "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-700",
    danger: "bg-danger text-white hover:bg-red-600 shadow-lg shadow-danger/20",
    ghost: "bg-transparent text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
  };

  return <button className={cn(base, sizes[size], variants[variant], className)} {...props}>{children}</button>;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: LucideIcon }> = ({ label, className = '', type, icon: Icon, ...props }) => {
  if (type === 'date') {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && <label className="typography-label-xs text-neutral-400 ml-1">{label}</label>}
        <DatePicker 
          value={String(props.value || '')} 
          onChange={(val) => props.onChange?.({ target: { value: val } } as any)} 
          disabled={props.disabled}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && <label className="typography-label-xs text-neutral-400 ml-1">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" 
            strokeWidth={2.5}
          />
        )}
        <input 
          type={type}
          className={cn(
            "w-full h-[50px] px-4 py-3 rounded-lg border transition-all duration-state outline-none font-bold",
            "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
            "text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder-neutral-500",
            "focus:ring-4 focus:ring-primary/5 focus:border-primary",
            "disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:text-neutral-400",
            Icon && "pl-11"
          )} 
          {...props} 
        />
      </div>
    </div>
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { 
  label?: string, 
  options: (string | Option)[], 
  placeholder?: string,
  icon?: LucideIcon
}> = ({ label, options, placeholder, className = '', onChange, value, icon, ...props }) => {
  return (
    <CustomSelect 
      label={label}
      options={options}
      value={value as string}
      onChange={(val) => onChange?.({ target: { value: val } } as any)}
      placeholder={placeholder}
      className={className}
      disabled={props.disabled}
      icon={icon}
    />
  );
};

export const Card: React.FC<{ 
  children: React.ReactNode, 
  title?: string, 
  className?: string, 
  action?: React.ReactNode,
  noPadding?: boolean,
  noHeaderBorder?: boolean
}> = ({ children, title, className = '', action, noPadding, noHeaderBorder }) => (
  <div className={cn(
    "bg-white dark:bg-neutral-800 rounded-xl shadow-cardLight dark:shadow-cardDark border border-neutral-200/50 dark:border-neutral-700/50 transition-all duration-page overflow-hidden",
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
    <div className={cn(noPadding ? "" : "p-6")}>{children}</div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-cardDark w-full max-w-2xl max-h-[90vh] flex flex-col scale-100 animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-between items-center px-8 py-6 shrink-0 bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 z-10">
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white font-display leading-none">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 bg-neutral-50/30 dark:bg-neutral-900/30">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Confirmation Modal ---
export const ConfirmationModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmLabel?: string;
  isProcessing?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Delete", isProcessing = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-cardDark w-full max-w-md overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-700">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center text-danger mb-6">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white font-display mb-3">{title}</h3>
          <p className="typography-caption mb-8 leading-relaxed">
            {message}
          </p>
          <div className="flex gap-4 w-full">
            <Button variant="ghost" onClick={onClose} className="flex-1 typography-label-xs" disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} className="flex-1 typography-label-xs" disabled={isProcessing}>
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
