import React from "react";
import Header from "./header";
import Footer from "./footer";
import { Marquee } from "@/components/ui/marquee";
import { useQuery } from "@tanstack/react-query";
import { fetchQuotes } from "@/lib/api";
import { ASSETS } from "@/lib/constants.gh-pages";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: quotes } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Quotes Marquee with improved styling */}
      <div className="bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 border-y border-pink-200 relative overflow-hidden">
        {quotes && quotes.length > 0 && (
          <Marquee 
            className="py-4"
            speed={30}
            gradient={true}
            gradientColor={[251, 207, 232]}
          >
            {quotes.map((quote, index) => (
              <div key={index} className="mx-8 flex items-center">
                <span className="text-gray-700 italic text-sm md:text-base">
                  "{quote.quote}"
                </span>
                <span className="ml-2 text-gray-600 text-xs md:text-sm">
                  - {quote.author || 'Anonymous'}
                </span>
                {index < quotes.length - 1 && (
                  <span className="mx-6 text-pink-400">•</span>
                )}
              </div>
            ))}
          </Marquee>
        )}
      </div>
      
      {/* Decorative floating elements */}
      <div className="fixed top-20 right-10 opacity-20 pointer-events-none z-0 hidden lg:block">
        <div className="w-24 h-24 floating-bg" style={{ animationDelay: '0s' }}>
          <img src={ASSETS.LOGO} alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      
      <div className="fixed bottom-20 left-10 opacity-20 pointer-events-none z-0 hidden lg:block">
        <div className="w-16 h-16 floating-bg" style={{ animationDelay: '2s' }}>
          <img src={ASSETS.LOGO} alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      
      {/* Main content with improved styling */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}