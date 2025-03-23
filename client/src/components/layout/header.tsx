import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ROUTES, SITE_NAME, SOCIAL_LINKS } from "@/lib/constants";
import { PinkyToeWordLogo } from "@/assets/logo";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href={ROUTES.HOME} onClick={closeMobileMenu}>
            <PinkyToeWordLogo className="h-14 md:h-16" />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href={ROUTES.HOME} className={`font-quicksand font-bold ${isActive(ROUTES.HOME) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}>
            Home
          </Link>
          <Link href={ROUTES.ARTICLES} className={`font-quicksand font-bold ${isActive(ROUTES.ARTICLES) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}>
            Articles
          </Link>
          <Link href={ROUTES.TEAM} className={`font-quicksand font-bold ${isActive(ROUTES.TEAM) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}>
            Team
          </Link>
          <a 
            href={SOCIAL_LINKS.INSTAGRAM} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-2xl text-primary hover:text-pinky-dark transition-colors"
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
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white px-4 py-3 shadow-inner">
          <div className="flex flex-col space-y-3">
            <Link 
              href={ROUTES.HOME}
              className={`font-quicksand font-bold ${isActive(ROUTES.HOME) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link 
              href={ROUTES.ARTICLES}
              className={`font-quicksand font-bold ${isActive(ROUTES.ARTICLES) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}
              onClick={closeMobileMenu}
            >
              Articles
            </Link>
            <Link 
              href={ROUTES.TEAM}
              className={`font-quicksand font-bold ${isActive(ROUTES.TEAM) ? 'text-pinky-dark' : 'text-primary hover:text-pinky-dark'} transition-colors`}
              onClick={closeMobileMenu}
            >
              Team
            </Link>
            <a 
              href={SOCIAL_LINKS.INSTAGRAM} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-quicksand font-bold text-primary hover:text-pinky-dark transition-colors"
            >
              <i className="fab fa-instagram mr-2"></i> Follow us on Instagram
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
