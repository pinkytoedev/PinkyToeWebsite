import React from 'react';

// Base path for GitHub Pages
const BASE_PATH = '/PinkyToeWebsite';

// Small logo for mobile and footer using TransparentLogo.png
export const SmallLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`inline-flex items-center ${className}`}>
    <img 
      src={`${BASE_PATH}/attached_assets/TransparentLogo.png`}
      alt="The Pinky Toe Logo" 
      className="h-full w-auto"
    />
  </div>
);

// Full word logo for desktop using TransparentWordLogo.png
export const FullWordLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`inline-flex items-center ${className}`}>
    <img 
      src={`${BASE_PATH}/attached_assets/TransparentWordLogo.png`}
      alt="The Pinky Toe" 
      className="h-full w-auto"
    />
  </div>
);