"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button once user scrolls down more than 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      type="button"
      aria-label="Scroll to top"
      title="Back to top"
      className={cn(
        "fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40",
        "w-10 h-10 sm:w-11 sm:h-11 rounded-full",
        "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white",
        "shadow-lg shadow-orange-500/35 hover:shadow-orange-500/50",
        "border border-white/25",
        "flex items-center justify-center",
        "transition-all duration-300 ease-in-out cursor-pointer",
        "hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ArrowUp className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.5]" />
    </button>
  );
}
