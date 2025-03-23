
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
    if (childrenArray.length <= 1 || isPaused) return;
    
    const intervalTime = 5000; // 5 seconds per quote
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [childrenArray, isPaused]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-hidden whitespace-nowrap",
        className
      )}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="flex justify-center">
        {childrenArray.length > 0 && (
          <div 
            className="animate-fade-in-out text-center" 
            key={activeIndex}
            style={{
              animationName: "fadeInOut",
              animationDuration: "5s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "1",
            }}
          >
            {childrenArray[activeIndex]}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(${direction === "left" ? "10%" : "-10%"}); }
          20% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(${direction === "left" ? "-10%" : "10%"}); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 5s ease-in-out;
        }
        `
      }} />
    </div>
  );
}
