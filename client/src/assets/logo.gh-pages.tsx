import React from "react";

interface LogoProps {
  className?: string;
}

// Base path for custom domain GitHub Pages
const BASE_PATH = '';

// Small logo for mobile and footer using TransparentLogo.png
export const PinkyToeLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`${className} relative`}>
      <img 
        src={`${BASE_PATH}/attached_assets/TransparentLogo.png`}
        alt="The Pinky Toe Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

// Full word logo for desktop using TransparentWordLogo.png
export const PinkyToeWordLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`${className} relative`}>
      <img 
        src={`${BASE_PATH}/attached_assets/TransparentWordLogo.png`}
        alt="The Pinky Toe Logo with Tagline" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};