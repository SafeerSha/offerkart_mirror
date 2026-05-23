import { toPng } from 'html-to-image';

/**
 * Preloads all image elements inside the DOM node, forcing crossOrigin credentials,
 * and handles broken/failed S3 image preloading by gracefully hiding and skipping them.
 */
async function preloadImages(element: HTMLElement): Promise<void> {
    const images = Array.from(element.querySelectorAll('img'));
    if (images.length === 0) return;
    
    console.log(`[Capture] Preloading ${images.length} images...`);
    
    await Promise.all(
        images.map((img) => {
            // Force S3 CORS mode
            img.setAttribute("crossorigin", "anonymous");
            img.crossOrigin = "anonymous";

            if (img.complete && img.naturalWidth > 0) {
                return Promise.resolve();
            }

            return new Promise<void>((resolve) => {
                const onLoad = () => {
                    img.removeEventListener('load', onLoad);
                    img.removeEventListener('error', onError);
                    resolve();
                };
                const onError = (e: any) => {
                    img.removeEventListener('load', onLoad);
                    img.removeEventListener('error', onError);
                    console.warn(`[Capture] Failed to preload image: ${img.src}. Gracefully skipping to prevent canvas taint crash.`, e);
                    // Hide the broken image in the captured element so it doesn't crash the renderer
                    img.style.visibility = "hidden";
                    img.style.display = "none";
                    img.removeAttribute("src"); // Clear source to avoid foreignObject load loops
                    resolve(); // Resolve anyway to allow export to continue
                };

                img.addEventListener('load', onLoad);
                img.addEventListener('error', onError);

                // Re-trigger load in case it got stuck or failed due to browser caching
                const currentSrc = img.src;
                if (currentSrc) {
                    img.src = "";
                    img.src = currentSrc;
                }

                // If NaturalWidth is 0 but complete is true, it is already broken
                if (img.complete && img.naturalWidth === 0) {
                    onError(new ErrorEvent('error'));
                }
            });
        })
    );
}

/**
 * Reusable utility to capture any HTML element (like a poster canvas) as a base64 PNG data URL,
 * using html-to-image. This is heavily optimized to handle S3 CORS, preloading, and skip broken images.
 */
export async function capturePosterAsImage(element: HTMLElement): Promise<string> {
    console.log("[Capture] Starting poster capture process...");

    // 1. Wait for custom fonts to be fully loaded
    if (typeof document !== 'undefined' && document.fonts) {
        try {
            console.log("[Capture] Waiting for document fonts to load...");
            await document.fonts.ready;
            console.log("[Capture] Fonts ready.");
        } catch (e) {
            console.warn("[Capture] Failed to wait for fonts to load:", e);
        }
    }

    // 2. Preload and clean images inside the element before cloning
    try {
        await preloadImages(element);
    } catch (e) {
        console.warn("[Capture] Preload images error:", e);
    }

    // 3. Create a deep clone of the element to avoid mutating the live editor DOM
    const clone = element.cloneNode(true) as HTMLElement;

    // 4. Create an off-screen container to attach the clone for computed style calculation
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = element.offsetWidth + "px";
    container.style.height = element.offsetHeight + "px";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    
    // Ensure all styles are correctly inherited from parent chain by copying font/color related rules
    container.style.fontFamily = window.getComputedStyle(element).fontFamily;
    
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
        console.log("[Capture] Processing cloned elements to prevent crashes...");

        // 5. Remove problematic elements that are unsupported by foreignObject rendering
        const elementsToRemove = clone.querySelectorAll("iframe, video, script, audio");
        if (elementsToRemove.length > 0) {
            console.log(`[Capture] Removing ${elementsToRemove.length} unsupported tags (iframe, video, script, audio)`);
            elementsToRemove.forEach(el => el.remove());
        }

        // 6. Ensure all img tags use crossOrigin="anonymous" and CORS-safe attributes in the clone
        const clonedImages = clone.querySelectorAll("img");
        clonedImages.forEach((img) => {
            img.setAttribute("crossorigin", "anonymous");
            img.crossOrigin = "anonymous";
            
            // Bust cache for dynamic/S3 images to bypass browser caching of non-CORS responses
            const src = img.getAttribute("src");
            if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
                const separator = src.includes("?") ? "&" : "?";
                img.setAttribute("src", `${src}${separator}t=${Date.now()}`);
            }
        });

        // 7. Strip/neutralize problematic CSS properties (backdrop-filter, mix-blend-mode, filter blur)
        const allNodes = clone.querySelectorAll("*");
        allNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
                const computed = window.getComputedStyle(node);

                // Backdrop Filter -> remove and replace with semi-opaque fallback
                const backdropFilter = computed.backdropFilter || (computed as any).webkitBackdropFilter || "";
                if (backdropFilter && backdropFilter !== "none") {
                    node.style.setProperty("backdrop-filter", "none", "important");
                    node.style.setProperty("-webkit-backdrop-filter", "none", "important");
                    
                    const bg = computed.backgroundColor;
                    if (bg && bg.includes("rgba")) {
                        const match = bg.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                        if (match) {
                            const r = match[1];
                            const g = match[2];
                            const b = match[3];
                            node.style.setProperty("background-color", `rgb(${r}, ${g}, ${b})`, "important");
                        }
                    } else if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") {
                        node.style.setProperty("background-color", "rgba(255, 255, 255, 0.9)", "important");
                    }
                }

                // Mix Blend Mode -> force to normal
                const mixBlendMode = computed.mixBlendMode || "";
                if (mixBlendMode && mixBlendMode !== "normal") {
                    node.style.setProperty("mix-blend-mode", "normal", "important");
                }

                // Filter with blur -> remove blur but preserve other filters
                const filterVal = computed.filter || "";
                if (filterVal && filterVal.includes("blur")) {
                    const cleanFilter = filterVal.replace(/blur\([^)]*\)/g, "").trim();
                    node.style.setProperty("filter", cleanFilter === "" ? "none" : cleanFilter, "important");
                }
            }
        });

        // 8. Capture using html-to-image toPng with high-resolution scaling and CORS config
        console.log("[Capture] Generating high-resolution PNG via html-to-image...");
        const dataUrl = await toPng(clone, {
            width: element.offsetWidth,
            height: element.offsetHeight,
            pixelRatio: 2, // Double resolution for crystal-clear HD PNGs
            cacheBust: true,
            skipFonts: true, // Bypass html-to-image font embedding mechanism to avoid CORS issues
            backgroundColor: "#ffffff",
            style: {
                transform: 'none',
                transformOrigin: 'top left',
            }
        });

        console.log("[Capture] Capture successful!");
        return dataUrl;
    } catch (error) {
        console.error("[Capture] Critical error during poster capture:", error);
        throw error;
    } finally {
        // 9. Clean up the off-screen clone container from the live DOM
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        console.log("[Capture] Cloned DOM cleaned up.");
    }
}
