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
      
      {/* Marquee Banner with improved styling */}
      <div className="bg-gradient-to-r from-primary via-pink-300 to-primary text-white py-3 overflow-hidden whitespace-nowrap shadow-md">
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
            {Array.isArray(quotes) && quotes.map((quote: any) => (
              <span key={quote.id} className="mx-8 font-pacifico text-lg drop-shadow-sm">✧ {quote.quote} ✧</span>
            ))}
          </Marquee>
        )}
      </div>
      
      {/* Main content with improved styling */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="bg-white/85 rounded-xl shadow-lg p-6 md:p-8 scale-in">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
