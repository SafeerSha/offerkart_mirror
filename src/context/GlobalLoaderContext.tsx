"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

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
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();

    const handleResetNav = useCallback(() => {
        setIsNavigating(false);
        setCustomText(null);
    }, []);

    // Global click listener to intercept navigation link & page-navigating card clicks
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleGlobalClick = (event: MouseEvent) => {
            // Ignore non-primary clicks (middle click, right click) or modified clicks (Ctrl, Meta, Shift, Alt)
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
                return;
            }

            const target = event.target as HTMLElement | null;
            if (!target) return;

            // 1. Find closest anchor tag (Next.js <Link>, standard <a>, breadcrumb links, text hyperlinks)
            const anchor = target.closest("a") as HTMLAnchorElement | null;
            if (anchor) {
                const rawHref = anchor.getAttribute("href");
                if (!rawHref) return;

                // Check for non-navigation protocols, new tab, downloads or ignored links
                if (
                    rawHref.startsWith("#") ||
                    rawHref.startsWith("mailto:") ||
                    rawHref.startsWith("tel:") ||
                    rawHref.startsWith("javascript:") ||
                    rawHref.startsWith("sms:") ||
                    anchor.hasAttribute("download") ||
                    anchor.target === "_blank" ||
                    anchor.getAttribute("data-no-loader") === "true" ||
                    anchor.classList.contains("no-loader")
                ) {
                    return;
                }

                try {
                    const url = new URL(anchor.href, window.location.origin);
                    const isExternal = url.origin !== window.location.origin;
                    const isSamePageHash = url.pathname === window.location.pathname && url.hash !== "" && url.search === window.location.search;
                    const isExactSamePage = url.pathname === window.location.pathname && url.search === window.location.search;

                    // Only trigger for relevant internal navigation to a different path or search query
                    if (!isExternal && !isSamePageHash && !isExactSamePage) {
                        const loaderText = anchor.getAttribute("data-loader-text") || "Navigating...";
                        setIsNavigating(true);
                        setCustomText(loaderText);
                    }
                } catch {
                    // Ignore URL parsing errors
                }
                return;
            }

            // 2. Intercept cards or clickable containers with data-href or data-navigate
            const navCard = target.closest("[data-navigate-card], [data-href], [data-navigate], [role='link']") as HTMLElement | null;
            if (navCard) {
                // If user clicked an inner interactive button/input/link inside the card, ignore card navigation
                if (target.closest("button, a, input, select, textarea, [role='button'], [data-prevent-card-nav]")) {
                    return;
                }
                const targetHref = navCard.getAttribute("data-href") || navCard.getAttribute("data-navigate");
                const loaderText = navCard.getAttribute("data-loader-text") || "Navigating...";

                if (targetHref) {
                    try {
                        const url = new URL(targetHref, window.location.origin);
                        if (url.origin === window.location.origin && (url.pathname !== window.location.pathname || url.search !== window.location.search)) {
                            setIsNavigating(true);
                            setCustomText(loaderText);
                        }
                    } catch {
                        setIsNavigating(true);
                        setCustomText(loaderText);
                    }
                } else if (navCard.hasAttribute("data-navigate-card")) {
                    setIsNavigating(true);
                    setCustomText(loaderText);
                }
                return;
            }

            // 3. Intercept buttons or interactive elements that explicitly request a loader
            const clickable = target.closest("button, [role='option'], [role='menuitem'], [data-loader-text]") as HTMLElement | null;
            if (clickable) {
                const loaderText = clickable.getAttribute("data-loader-text");
                if (loaderText || clickable.classList.contains("trigger-loader")) {
                    setIsNavigating(true);
                    setCustomText(loaderText || "Filtering...");
                }
            }
        };

        window.addEventListener("click", handleGlobalClick, { capture: true });
        return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
    }, []);

    // Safety auto-reset in case a navigation is aborted or instant-resolved without route change
    useEffect(() => {
        if (isNavigating) {
            const timeout = setTimeout(() => {
                setIsNavigating(false);
                setCustomText(null);
            }, 4000);
            return () => clearTimeout(timeout);
        }
    }, [isNavigating]);

    const showLoader = useCallback((text?: string) => {
        setManualCount((prev) => prev + 1);
        if (text) setCustomText(text);
    }, []);

    const hideLoader = useCallback(() => {
        setManualCount((prev) => Math.max(0, prev - 1));
    }, []);

    const isLoading = isNavigating || manualCount > 0 || isMutating > 0 || isFetching > 0;

    useEffect(() => {
        if (!isLoading) {
            setCustomText(null);
        }
    }, [isLoading]);

    // Determine current display text
    const activeText = customText || (isNavigating ? "Loading..." : isMutating > 0 ? "Updating..." : isFetching > 0 ? "Loading..." : "Loading...");

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
                    className="fixed bottom-5 left-5 z-[99999] pointer-events-none select-none animate-in slide-in-from-bottom-4 fade-in duration-200"
                >
                    <div className="flex items-center gap-0.5 px-4 py-1.5 rounded-full text-orange-600 bg-white/70 border border-orange-400/30 border-b-[2.5px] border-b-orange-500/40">
                        <span className=" text-[9px] sm:text-[11px] font-bold text-orange-600 tracking-wide font-sans ">
                            {activeText.replace(/\.\.\.$/, "")}
                        </span>
                        <div className="flex items-baseline gap-0.5 ml-1">
                            <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-orange-500 shadow-[0_1px_2px_rgba(249,115,22,0.5)] animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-orange-500 shadow-[0_1px_2px_rgba(249,115,22,0.5)] animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-orange-500 shadow-[0_1px_2px_rgba(249,115,22,0.5)] animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}
        </GlobalLoaderContext.Provider>
    );
}
