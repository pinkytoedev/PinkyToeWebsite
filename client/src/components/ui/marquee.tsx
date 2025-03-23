
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  speed?: number;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  children: React.ReactNode;
}

export function Marquee({
  className,
  speed = 20,
  pauseOnHover = false,
  direction = "left",
  children,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [childrenArray, setChildrenArray] = useState<React.ReactNode[]>([]);

  // Convert children to array so we can cycle through them
  useEffect(() => {
    // Handle both array and single child case
    const childArray = React.Children.toArray(children);
    setChildrenArray(childArray);
  }, [children]);

  // Set up the interval to change the active quote
  useEffect(() => {
    if (childrenArray.length <= 1) return;
    
    const intervalTime = 5000; // 5 seconds per quote
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [childrenArray]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // If there's only one item or none, just render it directly
  if (childrenArray.length <= 1) {
    return (
      <div 
        className={cn("flex overflow-hidden", className)}
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className={cn("flex overflow-hidden", className)}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-center w-full h-full">
        <div 
          className="transition-opacity duration-500"
          style={{
            opacity: 1,
          }}
        >
          {childrenArray[activeIndex]}
        </div>
      </div>
    </div>
  );
}
