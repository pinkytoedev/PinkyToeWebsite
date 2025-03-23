import { Link } from "wouter";
import { ROUTES, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";
import { PinkyToeLogo } from "@/assets/logo";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="md:flex md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <PinkyToeLogo className="h-16" />
            <p className="text-gray-600 mt-2">{SITE_TAGLINE}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-quicksand font-bold text-primary mb-3">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link href={ROUTES.HOME}>
                    <div className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Home</div>
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ARTICLES}>
                    <div className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Articles</div>
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.TEAM}>
                    <div className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Team</div>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-quicksand font-bold text-primary mb-3">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href={SOCIAL_LINKS.INSTAGRAM} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    <i className="fab fa-instagram mr-2"></i> Instagram
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:hello@pinkytoe.com" 
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    <i className="far fa-envelope mr-2"></i> Contact Us
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-quicksand font-bold text-primary mb-3">Subscribe</h3>
              <p className="text-gray-600 mb-2">Get our latest articles in your inbox</p>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="py-2 px-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary w-full"
                  aria-label="Email for newsletter"
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-pinky-dark text-white font-quicksand font-bold py-2 px-4 rounded-r-lg transition-colors"
                  aria-label="Subscribe"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} The Pinky Toe. All rights reserved.</p>
          <p className="mt-1 text-sm">Designed with <i className="fas fa-heart text-primary"></i> and feminist fury</p>
        </div>
      </div>
    </footer>
  );
}
