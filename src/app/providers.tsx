"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { Locale } from "@/lib/i18n/config";
import { LocationProvider } from "@/context/LocationContext";

export function Providers({ children, locale = "en", dictionary }: { children: React.ReactNode; locale?: Locale; dictionary: Record<string, any> }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <LanguageProvider locale={locale} dictionary={dictionary}>
          <LocationProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <Sonner />
            </ThemeProvider>
          </LocationProvider>
        </LanguageProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
