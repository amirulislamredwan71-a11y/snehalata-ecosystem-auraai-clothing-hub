import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-20 h-20' : 'w-11 h-11';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 40 : 24;
  
  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <div className={`relative ${sizeClass} flex items-center justify-center`}>
          {/* Animated Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-tr from-aura-purple/30 to-blue-500/10 rounded-xl rotate-45 group-hover:rotate-180 transition-transform duration-1000 ease-out"></div>
          <div className="absolute inset-0 bg-aura-purple/10 rounded-xl -rotate-12 group-hover:rotate-45 transition-transform duration-1000 ease-out delay-100 border border-white/5"></div>
          
          {/* Main Icon Container */}
          <div className="relative z-10 w-full h-full border border-aura-purple/30 rounded-xl flex items-center justify-center bg-black/80 backdrop-blur-md group-hover:border-aura-purple group-hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-aura-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white group-hover:text-aura-purple transition-colors duration-500 relative z-10">
                  {/* Outer Ring Segment */}
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-aura-purple group-hover:stroke-opacity-100 transition-all duration-700 ease-in-out [stroke-dasharray:10_5] group-hover:[stroke-dasharray:0_0]" />
                  <path d="M2 12C2 17.5228 6.47715 22 12 22" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Central Neural Node */}
                  <path d="M12 12L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:stroke-white transition-colors" />
                  <path d="M12 12L17.1962 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:stroke-white transition-colors delay-75" />
                  <path d="M12 12L6.80385 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:stroke-white transition-colors delay-150" />
                  
                  {/* Core */}
                  <circle cx="12" cy="12" r="3" className="fill-current text-white group-hover:text-aura-purple transition-colors duration-500 group-hover:scale-75 origin-center animate-pulse" />
                  
                  {/* End Points */}
                  <circle cx="12" cy="6" r="1.5" fill="currentColor" className="group-hover:translate-y-[-2px] transition-transform duration-500"/>
                  <circle cx="17.1962" cy="15" r="1.5" fill="currentColor" className="group-hover:translate-x-[2px] transition-transform duration-500"/>
                  <circle cx="6.80385" cy="15" r="1.5" fill="currentColor" className="group-hover:translate-x-[-2px] transition-transform duration-500"/>
              </svg>
          </div>
      </div>
      
      {showText && (
          <div className="flex flex-col leading-none relative">
              <span className={`font-black tracking-[0.3em] text-white/50 group-hover:text-aura-purple transition-colors duration-500 ${size === 'lg' ? 'text-xs mb-1' : 'text-[9px] mb-0.5'}`}>SNEHALATA</span>
              <div className="relative overflow-visible">
                <span className={`font-bold text-white bn-heavy tracking-wide group-hover:tracking-wider transition-all duration-500 relative z-10 block ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>স্নেহলতা</span>
                <span className={`absolute top-0 left-0 font-bold text-aura-purple bn-heavy tracking-wide blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 block ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>স্নেহলতা</span>
              </div>
          </div>
      )}
    </div>
  );
};