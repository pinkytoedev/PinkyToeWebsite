import { Link } from "wouter";
import { ROUTES, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";
import { PinkyToeLogo } from "@/assets/logo";

export function Footer() {
  return (
    <footer className="bg-white/95 border-t border-gray-200 mt-6 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="md:flex md:justify-between md:items-center">
          {/* Footer Logo Section - Using Small Logo */}
          <div className="mb-4 md:mb-0 flex flex-col items-center md:items-start">
            <div className="flex items-center">
              <Link href={ROUTES.HOME}>
                <div className="hover:scale-105 transition-transform">
                  <PinkyToeLogo className="h-12 w-auto" />
                </div>
              </Link>
              <p className="text-gray-600 ml-3 font-quicksand text-sm hidden md:block">{SITE_TAGLINE}</p>
              <div className="ml-4 flex space-x-3">
                <a
                  href={SOCIAL_LINKS.INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-pinky-dark transition-colors text-xl"
                  aria-label="Follow us on Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href="mailto:hello@pinkytoe.com"
                  className="text-primary hover:text-pinky-dark transition-colors text-xl"
                  aria-label="Email us"
                >
                  <i className="far fa-envelope"></i>
                </a>
              </div>
            </div>
            <p className="text-gray-600 mt-2 font-quicksand text-center text-sm md:hidden">{SITE_TAGLINE}</p>
          </div>

          {/* Footer Navigation Links */}
          <div className="flex flex-wrap justify-center md:justify-end">
            <div className="mr-8">
              <h3 className="font-quicksand font-bold text-primary mb-2 text-sm">Navigation</h3>
              <ul className="flex space-x-4 md:space-x-6">
                <li>
                  <Link href={ROUTES.HOME}>
                    <div className="text-gray-600 hover:text-primary transition-colors text-sm">Home</div>
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ARTICLES}>
                    <div className="text-gray-600 hover:text-primary transition-colors text-sm">Articles</div>
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.TEAM}>
                    <div className="text-gray-600 hover:text-primary transition-colors text-sm">Team</div>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-200 mt-3 pt-3 text-center text-gray-600 text-xs">
          <p>
            &copy; {new Date().getFullYear()} The Pinky Toe. All rights reserved. |
            <Link href={ROUTES.PRIVACY_POLICY}>
              <span className="text-gray-600 hover:text-primary transition-colors cursor-pointer mx-2">Privacy Policy</span>
            </Link>
            | Designed with <i className="fas fa-heart text-primary pulse"></i> and feminist furries
          </p>
        </div>
      </div>
    </footer>
  );
}
