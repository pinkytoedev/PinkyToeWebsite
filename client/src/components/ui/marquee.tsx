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
  const trackRef = React.useRef<HTMLDivElement>(null);
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

    // Fractional width, not scrollWidth: the integer rounding shows up as a
    // visible jump every time the loop restarts.
    const measuredWidth =
      contentRef.current.getBoundingClientRect().width || contentRef.current.scrollWidth;
    if (measuredWidth === 0) return;

    // The copy has to travel its own width *plus* the gap separating it from
    // the duplicate, or the seam closes up and two quotes collide once per lap.
    // Read the gap rather than hard-coding it so it tracks the class below.
    const gap = trackRef.current
      ? parseFloat(window.getComputedStyle(trackRef.current).columnGap) || 0
      : 0;
    const distance = measuredWidth + gap;

    const normalizedSpeed = Math.max(speed, 1);
    setAnimationDuration(Math.max(distance / normalizedSpeed, 5));
    setContentWidth(distance);
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
        ref={trackRef}
        // The gap belongs on the track, not only inside each copy. Quotes
        // within a copy sat 96px apart while the join between the two copies
        // was 0px, so once per lap the last quote and the first ran straight
        // into each other with no space — which is what "the quotes look
        // squished" was. The more quotes there are, the more often it shows.
        className="flex items-center gap-24 whitespace-nowrap px-10"
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
