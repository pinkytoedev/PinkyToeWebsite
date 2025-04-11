import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { Marquee } from "@/components/ui/marquee";
import { fetchQuotes } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CarouselQuote } from "@shared/schema";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: quotes, isLoading, error } = useQuery<CarouselQuote[]>({
    queryKey: ["/api/quotes"],
  });
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex flex-col min-h-screen ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      <Header />
      
      {/* Marquee Banner with solid color */}
      <div className="bg-primary text-white py-3 overflow-hidden whitespace-nowrap shadow-md">
        {isLoading ? (
          <div className="container mx-auto">
            <Skeleton className="h-6 w-3/4 bg-primary-foreground/20" />
          </div>
        ) : error ? (
          <div className="container mx-auto text-center">
            <span className="font-pacifico text-lg">Welcome to The Pinky Toe!</span>
          </div>
        ) : (
          <Marquee speed={35} pauseOnHover={true}>
            {Array.isArray(quotes) && quotes
              .filter((quote: CarouselQuote) => quote.carousel === 'main')
              .map((quote: CarouselQuote) => (
                <span key={quote.id} className="mx-8 text-lg drop-shadow-sm">{quote.quote}</span>
              ))
            }
          </Marquee>
        )}
      </div>
      
      {/* Decorative floating elements */}
      <div className="fixed top-20 right-10 opacity-20 pointer-events-none z-0 hidden lg:block">
        <div className="w-24 h-24 floating-bg" style={{ animationDelay: '0s' }}>
          <img src="/attached_assets/TransparentLogo.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      
      <div className="fixed bottom-20 left-10 opacity-20 pointer-events-none z-0 hidden lg:block">
        <div className="w-16 h-16 floating-bg" style={{ animationDelay: '2s' }}>
          <img src="/attached_assets/TransparentLogo.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      
      {/* Main content with improved styling */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 scale-in border border-pink-200/30">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
