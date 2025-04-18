import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderSrc?: string;
  threshold?: number;
  delay?: number;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderSrc = '/api/images/placeholder',
  threshold = 0.1,
  delay = 300,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set up the intersection observer to detect when image is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  // When the image becomes visible, load the actual image with a delay
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (isVisible && src) {
      timeoutId = setTimeout(() => {
        setCurrentSrc(src);
      }, delay);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, src, delay]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className || ''}`}
      onLoad={() => setIsLoaded(true)}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        console.error(`Failed to load image: ${target.src}`);
        
        // Only set to placeholder if it's not already the placeholder
        if (target.src !== placeholderSrc) {
          target.src = placeholderSrc;
        }
      }}
      {...props}
    />
  );
}