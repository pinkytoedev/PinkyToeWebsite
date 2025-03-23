import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ROUTES, SITE_NAME, SOCIAL_LINKS } from "@/lib/constants";
import { PinkyToeWordLogo, PinkyToeLogo } from "@/assets/logo";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md transition-all duration-300 ${scrolled ? 'shadow-lg py-1' : 'py-2'}`}>
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        {/* Responsive Logo - Small for mobile, large for desktop */}
        <div className="flex items-center">
          <Link href={ROUTES.HOME} onClick={closeMobileMenu}>
            <div className="hover-bounce transition-transform duration-300 hover:scale-105">
              {/* Mobile: Show the smaller logo */}
              <div className="block md:hidden">
                <PinkyToeLogo className="h-12 w-auto transition-transform duration-300" />
              </div>
              
              {/* Desktop: Show the full word logo with tagline */}
              <div className="hidden md:block">
                <PinkyToeWordLogo className="h-14 lg:h-16 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href={ROUTES.HOME} className={`font-quicksand font-bold text-lg ${isActive(ROUTES.HOME) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}>
            Home
          </Link>
          <Link href={ROUTES.ARTICLES} className={`font-quicksand font-bold text-lg ${isActive(ROUTES.ARTICLES) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}>
            Articles
          </Link>
          <Link href={ROUTES.TEAM} className={`font-quicksand font-bold text-lg ${isActive(ROUTES.TEAM) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}>
            Team
          </Link>
          <a 
            href={SOCIAL_LINKS.INSTAGRAM} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-2xl text-primary hover:text-pinky-dark transition-colors hover:scale-125 transform duration-300"
            aria-label="Follow us on Instagram"
          >
            <i className="fab fa-instagram"></i>
          </a>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-primary focus:outline-none" 
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
        </button>
      </div>
      
      {/* Mobile Navigation - Slide down animation when opened */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm px-4 py-4 shadow-inner slide-down">
          <div className="flex flex-col space-y-4">
            <Link 
              href={ROUTES.HOME}
              className={`font-quicksand font-bold text-lg ${isActive(ROUTES.HOME) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center py-1">
                <span className="text-primary mr-2">›</span> Home
              </div>
            </Link>
            <Link 
              href={ROUTES.ARTICLES}
              className={`font-quicksand font-bold text-lg ${isActive(ROUTES.ARTICLES) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center py-1">
                <span className="text-primary mr-2">›</span> Articles
              </div>
            </Link>
            <Link 
              href={ROUTES.TEAM}
              className={`font-quicksand font-bold text-lg ${isActive(ROUTES.TEAM) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center py-1">
                <span className="text-primary mr-2">›</span> Team
              </div>
            </Link>
            <a 
              href={SOCIAL_LINKS.INSTAGRAM} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-quicksand font-bold text-lg text-primary hover:text-pinky-dark transition-colors"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center py-1">
                <span className="text-primary mr-2">›</span>
                <i className="fab fa-instagram mr-2"></i> Follow us on Instagram
              </div>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
