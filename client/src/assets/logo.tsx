import React from "react";

interface LogoProps {
  className?: string;
}

export const PinkyToeLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 400 240" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Pinky Toe Logo"
    >
      <g>
        <path 
          d="M200,120 C220,100 260,100 280,120 C300,140 300,180 280,200 L240,240 C220,260 180,260 160,240 C140,220 140,180 160,160 L200,120" 
          fill="#FF4D8D" 
          stroke="#FF4D8D" 
          strokeWidth="2"
        />
        <text 
          x="80" 
          y="80" 
          fontFamily="Pacifico, cursive" 
          fontSize="36" 
          fill="#FF4D8D" 
          textAnchor="middle"
        >
          THE
        </text>
        <text 
          x="200" 
          y="120" 
          fontFamily="Pacifico, cursive" 
          fontSize="64" 
          fill="#FF4D8D" 
          textAnchor="middle"
        >
          Pinky
        </text>
        <text 
          x="280" 
          y="180" 
          fontFamily="Pacifico, cursive" 
          fontSize="54" 
          fill="#FFC0CB" 
          textAnchor="middle"
        >
          Toe
        </text>
        
        {/* Sparkles */}
        <path d="M310,90 L315,85 M310,85 L315,90 M320,85 L325,90 M320,90 L325,85" stroke="#FFD700" strokeWidth="2" />
        <path d="M330,120 L335,115 M330,115 L335,120 M340,115 L345,120 M340,120 L345,115" stroke="#FFD700" strokeWidth="2" />
      </g>
    </svg>
  );
};

export const PinkyToeWordLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 600 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Pinky Toe Logo with Tagline"
    >
      <g>
        <text 
          x="50" 
          y="50" 
          fontFamily="Pacifico, cursive" 
          fontSize="24" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          THE
        </text>
        <text 
          x="50" 
          y="100" 
          fontFamily="Pacifico, cursive" 
          fontSize="48" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          Pinky
        </text>
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
        <text 
          x="50" 
          y="140" 
          fontFamily="Pacifico, cursive" 
          fontSize="18" 
          fill="#FF4D8D" 
          textAnchor="start"
        >
          FEMINIST HUMOR, RIGHT AT YOUR FEET.
        </text>
        
        {/* Tiny toe shape */}
        <path 
          d="M320,70 C325,65 335,65 340,70 C345,75 345,85 340,90 L330,100 C325,105 315,105 310,100 C305,95 305,85 310,80 L320,70" 
          fill="#FF4D8D" 
          stroke="#FF4D8D" 
          strokeWidth="1"
        />
        
        {/* Sparkles */}
        <path d="M350,50 L355,45 M350,45 L355,50" stroke="#FFD700" strokeWidth="2" />
        <path d="M370,60 L375,55 M370,55 L375,60" stroke="#FFD700" strokeWidth="2" />
      </g>
    </svg>
  );
};
