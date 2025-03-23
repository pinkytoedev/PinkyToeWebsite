import { useState, useEffect } from "react";
import { getImageUrl, getImageUrlAsync } from "@/lib/image-helper";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// Omit the src prop from the standard HTML image attributes
// so we can redefine it with our own type
interface AsyncImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | any[] | null | undefined;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
}

/**
 * AsyncImage component that optimizes image loading by:
 * 1. Asynchronously resolving the optimal image URL (local cache when available)
 * 2. Showing a skeleton or placeholder during loading
 * 3. Handling errors with fallback images
 * 4. Supporting all standard img props
 */
export function AsyncImage({
  src,
  alt,
  fallbackSrc = "/assets/placeholder-image.svg",
  className,
  containerClassName,
  showSkeleton = true,
  ...props
}: AsyncImageProps) {
  // Initial URL from sync function for immediate display
  const initialSrc = getImageUrl(src);
  
  // State for the optimized URL that will be loaded asynchronously
  const [imageSrc, setImageSrc] = useState<string>(initialSrc);
  const [isLoading, setIsLoading] = useState<boolean>(initialSrc !== fallbackSrc);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset states when src changes
    const syncSrc = getImageUrl(src);
    setImageSrc(syncSrc);
    setIsLoading(syncSrc !== fallbackSrc);
    setError(false);
    
    let isMounted = true;

    async function loadOptimizedImage() {
      try {
        // Try to get the optimized URL that uses cached local files when possible
        const optimizedSrc = await getImageUrlAsync(src);
        
        if (isMounted) {
          setImageSrc(optimizedSrc);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading optimized image:", err);
          setError(true);
          setIsLoading(false);
        }
      }
    }

    loadOptimizedImage();

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc]);

  const handleError = () => {
    setError(true);
    setImageSrc(fallbackSrc);
  };

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && showSkeleton && (
        <Skeleton className={cn("absolute inset-0", className)} />
      )}
      <img
        src={error ? fallbackSrc : imageSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300", 
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onError={handleError}
        {...props}
      />
    </div>
  );
}