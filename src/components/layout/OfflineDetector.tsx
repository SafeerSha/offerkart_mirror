"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineDetector({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
      setIsRetrying(false);
    }, 800);
  };

  return (
    <>
      {children}
      
      {!isOnline && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 drop-shadow-xl">
          <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-2.5 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] border border-red-800/50 font-inter">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium text-sm drop-shadow-sm">No Internet Connection</span>
            <div className="w-px h-5 bg-white/30 mx-1" />
            <button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="flex items-center gap-1.5 text-sm font-semibold hover:bg-white/20 px-3 py-1 rounded-full transition-colors disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Checking..." : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
