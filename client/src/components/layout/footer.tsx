import { Link } from "wouter";
import { ROUTES, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";
import { PinkyToeLogo } from "@/assets/logo";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="md:flex md:justify-between md:items-center">
          <div className="mb-6 md:mb-0 fade-in">
            <Link href={ROUTES.HOME}>
              <div className="hover-bounce">
                <PinkyToeLogo className="h-16 w-auto" />
              </div>
            </Link>
            <p className="text-gray-600 mt-2 font-quicksand">{SITE_TAGLINE}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 slide-up">
            <div className="scale-in" style={{ animationDelay: '100ms' }}>
              <h3 className="font-quicksand font-bold text-primary mb-3 text-lg">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link href={ROUTES.HOME}>
                    <div className="text-gray-600 hover:text-primary transition-colors cursor-pointer hover:translate-x-1 duration-300 flex items-center">
                      <span className="text-primary mr-2">›</span> Home
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ARTICLES}>
                    <div className="text-gray-600 hover:text-primary transition-colors cursor-pointer hover:translate-x-1 duration-300 flex items-center">
                      <span className="text-primary mr-2">›</span> Articles
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.TEAM}>
                    <div className="text-gray-600 hover:text-primary transition-colors cursor-pointer hover:translate-x-1 duration-300 flex items-center">
                      <span className="text-primary mr-2">›</span> Team
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="scale-in" style={{ animationDelay: '200ms' }}>
              <h3 className="font-quicksand font-bold text-primary mb-3 text-lg">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href={SOCIAL_LINKS.INSTAGRAM} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-300"
                  >
                    <span className="text-pink-500 mr-2 text-xl">
                      <i className="fab fa-instagram"></i>
                    </span> 
                    <span>Instagram</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:hello@pinkytoe.com" 
                    className="text-gray-600 hover:text-primary transition-colors flex items-center hover:translate-x-1 duration-300"
                  >
                    <span className="text-pink-500 mr-2 text-xl">
                      <i className="far fa-envelope"></i>
                    </span> 
                    <span>Contact Us</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="scale-in" style={{ animationDelay: '300ms' }}>
              <h3 className="font-quicksand font-bold text-primary mb-3 text-lg">Subscribe</h3>
              <p className="text-gray-600 mb-2">Get our latest articles in your inbox</p>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="py-2 px-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  aria-label="Email for newsletter"
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-pinky-dark text-white font-quicksand font-bold py-2 px-4 rounded-r-lg transition-colors hover:scale-105 transform duration-300"
                  aria-label="Subscribe"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-600 fade-in" style={{ animationDelay: '500ms' }}>
          <p>&copy; {new Date().getFullYear()} The Pinky Toe. All rights reserved.</p>
          <p className="mt-1 text-sm">Designed with <i className="fas fa-heart text-primary pulse"></i> and feminist fury</p>
        </div>
      </div>
    </footer>
  );
}
