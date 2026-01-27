
import React from 'react';

export const Logo: React.FC<{ className?: string, textClassName?: string, showText?: boolean }> = ({ 
  className = "w-8 h-8", 
  textClassName = "text-xl",
  showText = true 
}) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${className} text-slate-900 flex-shrink-0`}>
        {/* 
          Logo Logic: 
          - Monoline / Single Stroke for modern scalability.
          - Geometric W composed of two overlapping chevrons.
          - "currentColor" allows it to be white on dark backgrounds automatically.
        */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path 
            d="M4 6L9 18L14 6" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M10 6L15 18L20 6" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="opacity-60" // Subtle difference for the second part of W to imply depth
          />
          {/* The "Plus" accent integrated subtly or kept separate in text */}
        </svg>
      </div>
      {showText && (
        <div className="flex items-baseline" dir="ltr">
          <span className={`font-black text-slate-900 tracking-tight ${textClassName}`}>WARSHA</span>
          <span className={`font-black text-emerald-500 ${textClassName}`}>+</span>
        </div>
      )}
    </div>
  );
};
