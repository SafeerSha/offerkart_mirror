"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-red-50/50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-foreground">
            Critical Error
          </h1>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            A critical error occurred at the application level. Please try refreshing the page or come back later.
          </p>
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <RefreshCcw className="w-5 h-5" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
