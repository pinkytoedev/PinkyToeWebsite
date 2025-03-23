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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [clones, setClones] = useState<React.ReactNode[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate animation duration based on content width and desired speed
  const getDuration = () => {
    // Adjust the multiplier if you need to make it faster/slower
    return contentWidth / speed;
  };

  useEffect(() => {
    if (contentRef.current) {
      const width = contentRef.current.offsetWidth;
      setContentWidth(width);
      
      // We need enough clones to fill the container width
      // Ensure we have at least 1 clone, and protect against invalid calculations
      const numClones = Math.max(1, Math.ceil(window.innerWidth / (width || 1)) + 1);
      setClones(Array.from({ length: numClones }).map(() => children));
    }
  }, [children]);

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
      <div
        className="inline-flex"
        style={{
          animationPlayState: isPaused ? "paused" : "running",
          animationName: "marquee",
          animationDuration: `${getDuration()}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: direction === "left" ? "normal" : "reverse",
        }}
      >
        <div ref={contentRef} className="flex">
          {children}
        </div>
        
        {clones.map((clone, index) => (
          <div key={index} className="flex">
            {clone}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${contentWidth}px); }
        }
        `
      }} />
    </div>
  );
}
