import { Link } from "wouter";
import { ROUTES, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";
import { PinkyToeLogo } from "@/assets/logo";

export function Footer() {
  return (
    <footer className="bg-white/95 border-t border-gray-200 mt-12 shadow-md">
      <div className="container mx-auto px-4 py-8">
        <div className="md:flex md:justify-between md:items-start">
          {/* Footer Logo Section - Using Small Logo */}
          <div className="mb-8 md:mb-0 fade-in flex flex-col items-center md:items-start">
            <Link href={ROUTES.HOME}>
              <div className="hover-bounce transition-transform duration-300 hover:scale-105">
                <PinkyToeLogo className="h-16 w-auto md:h-20" />
              </div>
            </Link>
            <p className="text-gray-600 mt-3 font-quicksand text-center md:text-left">{SITE_TAGLINE}</p>
            <div className="mt-4 flex space-x-4">
              <a 
                href={SOCIAL_LINKS.INSTAGRAM} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-pinky-dark transition-colors text-2xl hover:scale-110 transform duration-300"
                aria-label="Follow us on Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a 
                href="mailto:hello@pinkytoe.com" 
                className="text-primary hover:text-pinky-dark transition-colors text-2xl hover:scale-110 transform duration-300"
                aria-label="Email us"
              >
                <i className="far fa-envelope"></i>
              </a>
            </div>
          </div>
          
          {/* Footer Navigation Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 slide-up">
            <div className="scale-in" style={{ animationDelay: '100ms' }}>
              <h3 className="font-quicksand font-bold text-primary mb-4 text-lg border-b border-pink-200 pb-2">Navigation</h3>
              <ul className="space-y-3">
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
              <h3 className="font-quicksand font-bold text-primary mb-4 text-lg border-b border-pink-200 pb-2">About Us</h3>
              <p className="text-gray-600 mb-3">The Pinky Toe brings feminist humor and insightful commentary on today's issues.</p>
              <p className="text-gray-600">Our team of writers creates content that's both thought-provoking and entertaining.</p>
            </div>
            
            <div className="scale-in" style={{ animationDelay: '300ms' }}>
              <h3 className="font-quicksand font-bold text-primary mb-4 text-lg border-b border-pink-200 pb-2">Subscribe</h3>
              <p className="text-gray-600 mb-3">Get our latest articles in your inbox</p>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="py-2 px-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary flex-grow"
                  aria-label="Email for newsletter"
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-pinky-dark text-white font-quicksand font-bold py-2 px-4 rounded-r-lg transition-colors hover:scale-105 transform duration-300 shadow-sm"
                  aria-label="Subscribe"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-600 fade-in" style={{ animationDelay: '500ms' }}>
          <p>&copy; {new Date().getFullYear()} The Pinky Toe. All rights reserved.</p>
          <p className="mt-2 text-sm">Designed with <i className="fas fa-heart text-primary pulse"></i> and feminist fury</p>
        </div>
      </div>
    </footer>
  );
}
