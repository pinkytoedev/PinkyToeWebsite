import { useQuery } from "@tanstack/react-query";
import { Header } from "./header";
import { Footer } from "./footer";
import { Marquee } from "@/components/ui/marquee";
import { fetchQuotes } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: quotes, isLoading, error } = useQuery({
    queryKey: ["/api/quotes"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Marquee Banner */}
      <div className="bg-primary text-white py-3 overflow-hidden whitespace-nowrap">
        {isLoading ? (
          <div className="container mx-auto">
            <Skeleton className="h-6 w-3/4 bg-primary-foreground/20" />
          </div>
        ) : error ? (
          <div className="container mx-auto text-center">
            <span className="font-pacifico text-lg">Welcome to The Pinky Toe!</span>
          </div>
        ) : (
          <Marquee>
            {quotes?.map((quote: any) => (
              <span key={quote.id} className="mx-8 font-pacifico text-lg">{quote.quote}</span>
            ))}
          </Marquee>
        )}
      </div>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
