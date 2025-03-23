import React from "react";

interface LogoProps {
  className?: string;
}

// Small logo for mobile and footer based on TransparentLogo.png
export const PinkyToeLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 400 300" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Pinky Toe Logo"
    >
      <g>
        {/* THE text */}
        <text 
          x="60" 
          y="60" 
          fontFamily="Pacifico, cursive" 
          fontSize="30" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          THE
        </text>
        
        {/* PINKY text */}
        <text 
          x="100" 
          y="120" 
          fontFamily="Pacifico, cursive" 
          fontSize="60" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          Pinky
        </text>
        
        {/* TOE text */}
        <text 
          x="180" 
          y="180" 
          fontFamily="Pacifico, cursive" 
          fontSize="50" 
          fill="#FFC0CB" 
          textAnchor="start"
        >
          Toe
        </text>
        
        {/* Foot outline */}
        <path 
          d="M320,130 C330,120 350,120 360,130 C370,140 370,160 360,170 L340,190 C330,200 310,200 300,190 C290,180 290,160 300,150 L320,130" 
          fill="none" stroke="#FF4D8D" 
          strokeWidth="2"
        />
        
        {/* Sparkles */}
        <path d="M260,90 L265,85 M260,85 L265,90" stroke="#FFD700" strokeWidth="2" />
        <path d="M280,100 L285,95 M280,95 L285,100" stroke="#FFD700" strokeWidth="2" />
      </g>
    </svg>
  );
};

// Full word logo for desktop based on TransparentWordLogo.png
export const PinkyToeWordLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 600 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Pinky Toe Logo with Tagline"
    >
      <g>
        {/* THE text */}
        <text 
          x="30" 
          y="50" 
          fontFamily="Pacifico, cursive" 
          fontSize="24" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          THE
        </text>
        
        {/* PINKY text */}
        <text 
          x="30" 
          y="100" 
          fontFamily="Pacifico, cursive" 
          fontSize="48" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          Pinky
        </text>
        
        {/* TOE text */}
        <text 
          x="230" 
          y="100" 
          fontFamily="Pacifico, cursive" 
          fontSize="42" 
          fill="#FFC0CB" 
          textAnchor="start"
        >
          Toe
        </text>
        
        {/* Tagline */}
        <text 
          x="30" 
          y="140" 
          fontFamily="Pacifico, cursive" 
          fontSize="18" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          FEMINIST HUMOR, RIGHT AT YOUR FEET.
        </text>
        
        {/* Sparkles */}
        <path d="M350,50 L355,45 M350,45 L355,50" stroke="#FFD700" strokeWidth="2" />
        <path d="M370,60 L375,55 M370,55 L375,60" stroke="#FFD700" strokeWidth="2" />
      </g>
    </svg>
  );
};
