import * as React from "react";
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
  const [isPaused, setIsPaused] = React.useState(false);

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

  // Convert children to array
  const childrenArray = React.Children.toArray(children);

  // Calculate animation duration based on speed (lower speed = slower animation)
  const animationDuration = `${speed}s`;

  return (
    <div
      className={cn("relative flex overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <style>
        {`
          @keyframes scroll-${direction} {
            0% {
              transform: translateX(${direction === "left" ? "0%" : "-100%"});
            }
            100% {
              transform: translateX(${direction === "left" ? "-100%" : "0%"});
            }
          }
          
          .animate-marquee {
            animation: scroll-${direction} ${animationDuration} linear infinite;
          }
          
          .animate-marquee.paused {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* First set of items */}
      <div
        className={cn(
          "flex shrink-0 items-center animate-marquee",
          isPaused && "paused"
        )}
      >
        {childrenArray}
      </div>

      {/* Duplicate set for seamless loop */}
      <div
        className={cn(
          "flex shrink-0 items-center animate-marquee",
          isPaused && "paused"
        )}
        aria-hidden="true"
      >
        {childrenArray}
      </div>
    </div>
  );
}