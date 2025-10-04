import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  /**
   * Approximate scroll speed in pixels per second.
   */
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [childrenArray, setChildrenArray] = React.useState<React.ReactNode[]>([]);
  const [animationDuration, setAnimationDuration] = React.useState<number>(20);
  const [contentWidth, setContentWidth] = React.useState<number>(0);

  // Convert children to array once when they change
  React.useEffect(() => {
    const childArray = React.Children.toArray(children);
    setChildrenArray(childArray);
  }, [children]);

  const calculateDuration = React.useCallback(() => {
    if (!contentRef.current) return;

    const measuredWidth = contentRef.current.scrollWidth;
    if (measuredWidth === 0) return;

    const normalizedSpeed = Math.max(speed, 1);
    setAnimationDuration(Math.max(measuredWidth / normalizedSpeed, 5));
    setContentWidth(measuredWidth);
  }, [speed]);

  React.useEffect(() => {
    if (childrenArray.length === 0) return;

    const frame = requestAnimationFrame(() => {
      calculateDuration();
    });

    window.addEventListener("resize", calculateDuration);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", calculateDuration);
    };
  }, [childrenArray, calculateDuration]);

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
  if (childrenArray.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="flex items-center whitespace-nowrap px-10"
        style={(() => {
          const marqueeStyle: React.CSSProperties & {
            "--marquee-width"?: string;
          } = {
            animationName: "marquee-scroll",
            animationDuration: `${animationDuration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: isPaused ? "paused" : "running",
            animationDirection: direction === "right" ? "reverse" : "normal",
          };

          if (contentWidth > 0) {
            marqueeStyle["--marquee-width"] = `${contentWidth}px`;
          }

          return marqueeStyle;
        })()}
      >
        <div className="flex items-center gap-24" ref={contentRef}>
          {childrenArray.map((child, index) => (
            <div key={`marquee-item-${index}`} className="flex items-center">
              {child}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-24" aria-hidden="true">
          {childrenArray.map((child, index) => (
            <div key={`marquee-item-duplicate-${index}`} className="flex items-center">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}