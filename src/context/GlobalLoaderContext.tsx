"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "@/lib/icons";

interface GlobalLoaderContextType {
    isLoading: boolean;
    loadingText: string;
    showLoader: (text?: string) => void;
    hideLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType>({
    isLoading: false,
    loadingText: "Loading...",
    showLoader: () => { },
    hideLoader: () => { },
});

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

function RouteResetWatcher({ onReset }: { onReset: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        onReset();
    }, [pathname, searchParams, onReset]);

    return null;
}

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
    const [manualCount, setManualCount] = useState(0);
    const [customText, setCustomText] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const isMutating = useIsMutating();

    const handleResetNav = useCallback(() => {
        setIsNavigating(false);
    }, []);

    // Global click listener to intercept navigation link & button clicks
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleGlobalClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            // Find closest anchor tag or clickable button
            const anchor = target.closest("a") as HTMLAnchorElement | null;
            const button = target.closest("button") as HTMLButtonElement | null;

            if (anchor && anchor.href) {
                const url = new URL(anchor.href, window.location.origin);
                const isExternal = url.origin !== window.location.origin;
                const isSamePageHash = url.pathname === window.location.pathname && url.hash !== "";

                // Only trigger navigation loader for internal route changes
                if (!isExternal && !isSamePageHash && anchor.target !== "_blank") {
                    if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
                        setIsNavigating(true);
                        setCustomText("Navigating...");
                    }
                }
            } else if (button) {
                // If button has data-loader attribute or trigger-loader class
                const loaderText = button.getAttribute("data-loader-text");
                if (loaderText || button.classList.contains("trigger-loader")) {
                    setIsNavigating(true);
                    setCustomText(loaderText || "Processing...");
                }
            }
        };

        window.addEventListener("click", handleGlobalClick, { capture: true });
        return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
    }, []);

    const showLoader = useCallback((text?: string) => {
        setManualCount((prev) => prev + 1);
        if (text) setCustomText(text);
    }, []);

    const hideLoader = useCallback(() => {
        setManualCount((prev) => Math.max(0, prev - 1));
    }, []);

    const isLoading = isNavigating || manualCount > 0 || isMutating > 0;

    // Determine current display text
    const activeText = customText || (isNavigating ? "Navigating..." : isMutating > 0 ? "Updating..." : "Loading...");

    return (
        <GlobalLoaderContext.Provider value={{ isLoading, loadingText: activeText, showLoader, hideLoader }}>
            <Suspense fallback={null}>
                <RouteResetWatcher onReset={handleResetNav} />
            </Suspense>
            {children}
            {/* Next.js Floating Mini Loader Widget (Bottom-Left Corner) */}
            {isLoading && (
                <div
                    aria-live="polite"
                    aria-busy="true"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none select-none animate-in slide-in-from-bottom-4 fade-in duration-200"
                >
                    <div className="flex items-center gap-0.5 px-4 py-1.5 rounded-full text-orange-600 bg-white/70 border border-orange-400/30 border-b-[2.5px] border-b-orange-500/40">
                        <span className="text-[11px] font-bold text-orange-600 tracking-wide font-sans ">
                            {activeText.replace(/\.\.\.$/, "")}
                        </span>
                        <div className="flex items-baseline gap-0.5 ml-1">
                            <span className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_1px_2px_rgba(249,115,22,0.5)] animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_1px_2px_rgba(249,115,22,0.5)] animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_1px_2px_rgba(249,115,22,0.5)] animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}
        </GlobalLoaderContext.Provider>
    );
}
