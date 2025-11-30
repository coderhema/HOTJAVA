import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { playSound } from '../utils/audio';

const ThreeDCup: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    playSound('pop');
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400); // Duration matches animation
  };

  return (
    <div className="relative group p-4 -rotate-12 transition-transform duration-300 ease-out hover:-rotate-6">
      <button
        onClick={handleClick}
        className={`
          relative z-10
          w-24 h-24 
          bg-orange-500 
          rounded-[1.5rem] 
          flex items-center justify-center 
          transition-all duration-100 ease-in-out
          
          /* The 3D Depth Look */
          shadow-[0_6px_0_rgb(194,65,12)] 
          hover:shadow-[0_8px_0_rgb(194,65,12)]
          hover:-translate-y-0.5
          
          /* The "Pressed" State */
          active:shadow-none 
          active:translate-y-[6px]
          
          /* Tilt Animation on Click */
          ${isAnimating ? 'animate-wiggle' : ''}
          
          focus:outline-none
        `}
        aria-label="Hot Java Logo"
      >
        {/* Top Highlight (Bevel) */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[1.5rem] pointer-events-none"></div>

        {/* Grain Texture Overlay */}
        <div className="absolute inset-0 opacity-20 rounded-[1.5rem] pointer-events-none mix-blend-overlay overflow-hidden"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
             }}
        />

        {/* Icon */}
        <div className="relative transform transition-transform group-hover:scale-110 duration-300">
           <Coffee className="w-12 h-12 text-white drop-shadow-sm" strokeWidth={2.5} />
        </div>
      </button>
    </div>
  );
};

export default ThreeDCup;