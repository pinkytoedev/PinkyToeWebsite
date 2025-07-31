import React from 'react';

export function SmallLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Small logo for mobile and footer using TransparentLogo.png */}
      <img 
        src="/PinkyToeWebsite/attached_assets/TransparentLogo.png" 
        alt="The Pinky Toe" 
        className="w-full h-full object-contain" 
        draggable="false"
      />
    </div>
  );
}

export function WordLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Full word logo for desktop using TransparentWordLogo.png */}
      <img 
        src="/PinkyToeWebsite/attached_assets/TransparentWordLogo.png" 
        alt="The Pinky Toe" 
        className="w-full h-full object-contain"
        draggable="false"
      />
    </div>
  );
}