"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { FaXTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer 
      role="contentinfo" 
      className="relative bg-white text-orange-600 border-t border-orange-500 mt-auto overflow-hidden shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs">
          
          {/* Left: Copyright */}
          <div className="flex items-center shrink-0 text-orange-600">
            <p className="font-medium whitespace-nowrap" id="footer-copyright">
              &copy; {currentYear} OfferNearU
              <span className="hidden md:inline font-normal opacity-90">. All rights reserved.</span>
            </p>
          </div>

          {/* Center: Social Media Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow OfferNearU on X (Twitter)"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50/80 border border-orange-200/80 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-200"
            >
              <FaXTwitter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow OfferNearU on Instagram"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50/80 border border-orange-200/80 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-200"
            >
              <FaInstagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow OfferNearU on Facebook"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50/80 border border-orange-200/80 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-200"
            >
              <FaFacebookF className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow OfferNearU on LinkedIn"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50/80 border border-orange-200/80 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-200"
            >
              <FaLinkedinIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
          </div>

          {/* Right: Terms, Privacy & Top button */}
          <div className="flex items-center gap-2.5 sm:gap-5 text-orange-600 shrink-0 font-medium">
            <Link 
              href="/terms" 
              className="hover:text-orange-700 transition-colors whitespace-nowrap"
              id="footer-link-terms"
            >
              Terms
            </Link>
            <Link 
              href="/privacy" 
              className="hover:text-orange-700 transition-colors whitespace-nowrap"
              id="footer-link-privacy"
            >
              Privacy
            </Link>
            <button
              onClick={scrollToTop}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-orange-50/80 border border-orange-200/80 hover:bg-orange-500 hover:border-orange-500 hover:text-white text-orange-600 transition-all duration-200 inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label="Back to top of page"
            >
              <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Top</span>
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
