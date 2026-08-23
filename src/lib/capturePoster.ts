import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * Sanitize CSS text to replace unsupported color functions (lab, oklch, lch, color-mix)
 * with safe rgb fallbacks. html2canvas's internal CSS parser crashes on these modern
 * color functions from Tailwind v4 / Next.js 16.
 *
 * This operates on raw stylesheet TEXT, not computed styles, because html2canvas
 * parses the stylesheets before rendering and throws on unknown color functions.
 */
function sanitizeCssText(cssText: string): string {
    // Replace simple color functions: lab(), oklch(), lch()
    // These don't contain nested parentheses.
    let result = cssText
        .replace(/oklch\([^)]*\)/gi, 'rgb(128,128,128)')
        .replace(/\blab\([^)]*\)/gi, 'rgb(128,128,128)')
        .replace(/\blch\([^)]*\)/gi, 'rgb(128,128,128)');

    // Replace color-mix() which can contain nested parens like:
    // color-mix(in srgb, oklch(0.5 0.2 240), red 50%)
    // Use iterative balanced-paren matching.
    let output = '';
    let i = 0;
    while (i < result.length) {
        const cmIdx = result.toLowerCase().indexOf('color-mix(', i);
        if (cmIdx === -1) {
            output += result.slice(i);
            break;
        }
        output += result.slice(i, cmIdx);
        // Find balanced closing paren
        let depth = 0;
        let j = cmIdx + 'color-mix'.length;
        for (; j < result.length; j++) {
            if (result[j] === '(') depth++;
            if (result[j] === ')') {
                depth--;
                if (depth === 0) { j++; break; }
            }
        }
        output += 'rgb(128,128,128)';
        i = j;
    }

    return output;
}

/**
 * Sanitize all stylesheets in a cloned document to remove unsupported CSS color functions.
 * This MUST run in html2canvas's onclone callback BEFORE html2canvas parses the stylesheets.
 */
function sanitizeClonedStylesheets(clonedDoc: Document): void {
    // Sanitize inline <style> elements
    const styleEls = clonedDoc.querySelectorAll('style');
    styleEls.forEach((styleEl) => {
        const text = styleEl.textContent || '';
        if (/\b(?:lab|oklch|lch|color-mix)\s*\(/i.test(text)) {
            styleEl.textContent = sanitizeCssText(text);
        }
    });
}

/**
 * Check if a URL points to an external S3/CDN image that would fail CORS
 */
function isExternalS3Url(src: string): boolean {
    try {
        const url = new URL(src, window.location.origin);
        return url.hostname === 'offersnearu.s3.eu-north-1.amazonaws.com' || url.hostname.endsWith('.unsplash.com');
    } catch {
        return false;
    }
}

/**
 * Proxy an external image URL through the local /api/proxy-image endpoint
 * to serve it from the same origin and bypass CORS restrictions.
 */
function proxyImageUrl(src: string): string {
    return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

/**
 * Process images in a CLONED DOM tree for capture.
 * - Proxies external S3 images through same-origin API to bypass CORS
 * - REMOVES images that are broken or have empty/invalid src
 *
 * IMPORTANT: This operates only on the clone, never the live DOM.
 */
function processClonedImages(clone: HTMLElement): void {
    const images = Array.from(clone.querySelectorAll('img'));

    images.forEach((img) => {
        const src = img.getAttribute('src');

        // Remove images with no src or empty src — they fire onerror events in renderers
        if (!src || src.trim() === '') {
            // Replace with a neutral placeholder
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = '100%';
            placeholder.style.backgroundColor = '#f3f4f6';
            img.parentElement?.replaceChild(placeholder, img);
            return;
        }

        // For data: and blob: URLs, leave as-is (they're already local)
        if (src.startsWith('data:') || src.startsWith('blob:')) {
            return;
        }

        // Proxy S3 images through same-origin API to bypass CORS
        if (isExternalS3Url(src)) {
            img.removeAttribute('crossorigin');
            img.setAttribute('src', proxyImageUrl(src));
            return;
        }

        // For other external images, remove crossOrigin and cache-bust
        img.removeAttribute('crossorigin');
        const separator = src.includes('?') ? '&' : '?';
        img.setAttribute('src', `${src}${separator}_capture_t=${Date.now()}`);
    });
}

/**
 * Neutralize computed CSS styles that renderers can't handle:
 * - Modern color functions (oklch, lab, lch) in inline computed styles
 * - backdrop-filter, mix-blend-mode, filter blur
 */
function neutralizeComputedStyles(clone: HTMLElement): void {
    const allNodes = clone.querySelectorAll<HTMLElement>('*');
    allNodes.forEach((node) => {
        const computed = window.getComputedStyle(node);

        // Neutralize modern CSS color functions in computed styles
        const colorProps = [
            'color', 'backgroundColor', 'borderColor',
            'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
            'outlineColor', 'textShadow', 'boxShadow'
        ] as const;

        for (const prop of colorProps) {
            const val = (computed as any)[prop] || '';
            if (val && /oklch\(|lab\(|lch\(|color-mix\(|color\(space|color\(/i.test(val)) {
                const rgbVal = (computed as any)[prop];
                if (rgbVal && rgbVal !== 'rgba(0, 0, 0, 0)') {
                    const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                    node.style.setProperty(cssProp, rgbVal, 'important');
                }
            }
        }

        // Backdrop Filter → remove (unsupported by foreignObject/canvas renderers)
        const backdropFilter = computed.backdropFilter || (computed as any).webkitBackdropFilter || '';
        if (backdropFilter && backdropFilter !== 'none') {
            node.style.setProperty('backdrop-filter', 'none', 'important');
            node.style.setProperty('-webkit-backdrop-filter', 'none', 'important');

            const bg = computed.backgroundColor;
            if (bg && bg.includes('rgba')) {
                const match = bg.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                if (match) {
                    node.style.setProperty('background-color', `rgb(${match[1]}, ${match[2]}, ${match[3]})`, 'important');
                }
            } else if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
                node.style.setProperty('background-color', 'rgba(255, 255, 255, 0.9)', 'important');
            }
        }

        // Mix Blend Mode → force to normal
        const mixBlendMode = computed.mixBlendMode || '';
        if (mixBlendMode && mixBlendMode !== 'normal') {
            node.style.setProperty('mix-blend-mode', 'normal', 'important');
        }

        // Filter with blur → remove blur but preserve other filters
        const filterVal = computed.filter || '';
        if (filterVal && filterVal.includes('blur')) {
            const cleanFilter = filterVal.replace(/blur\([^)]*\)/g, '').trim();
            node.style.setProperty('filter', cleanFilter === '' ? 'none' : cleanFilter, 'important');
        }
    });
}

/**
 * Reusable utility to capture any HTML element (like a poster canvas) as a base64 PNG data URL,
 * using html2canvas as primary for robust CORS and Turbopack stylesheet support,
 * with html-to-image as a safe fallback.
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

    // 2. Try HTML2Canvas as the primary renderer
    try {
        console.log("[Capture] Attempting capture via html2canvas...");
        const canvas = await html2canvas(element, {
            useCORS: true,
            allowTaint: false, // CRITICAL: false ensures canvas stays clean for toDataURL() even if S3 CORS fails
            scale: 2, // Crisp retina-quality PNG
            backgroundColor: "#ffffff",
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight,
            onclone: (clonedDoc: Document) => {
                // STEP A: Sanitize stylesheet TEXT to remove unsupported color functions
                // This MUST happen before html2canvas's internal CSS parser processes them.
                // Without this, html2canvas throws "Attempting to parse an unsupported color function 'lab'"
                sanitizeClonedStylesheets(clonedDoc);

                // STEP B: Neutralize modern color syntax in computed styles of elements
                const nodes = clonedDoc.querySelectorAll<HTMLElement>('*');
                nodes.forEach((node) => {
                    const cs = window.getComputedStyle(node);
                    const colorProps = ["color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "boxShadow", "textShadow"] as const;
                    for (const prop of colorProps) {
                        const val = (cs as any)[prop] || "";
                        if (val && /oklch\(|lab\(|lch\(|color-mix\(|color\(space|color\(/i.test(val)) {
                            const rgbVal = (cs as any)[prop];
                            if (rgbVal) {
                                const cssProp = prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
                                node.style.setProperty(cssProp, rgbVal, "important");
                            }
                        }
                    }
                    // Also neutralize backdrop / mix-blend / blur
                    const bd = cs.backdropFilter || (cs as any).webkitBackdropFilter || "";
                    if (bd && bd !== "none") {
                        node.style.setProperty("backdrop-filter", "none", "important");
                        node.style.setProperty("-webkit-backdrop-filter", "none", "important");
                    }
                    const mb = cs.mixBlendMode || "";
                    if (mb && mb !== "normal") {
                        node.style.setProperty("mix-blend-mode", "normal", "important");
                    }
                    const fl = cs.filter || "";
                    if (fl && fl.includes("blur")) {
                        const clean = fl.replace(/blur\([^)]*\)/g, "").trim();
                        node.style.setProperty("filter", clean || "none", "important");
                    }
                });

                // STEP C: Handle images — proxy S3 images and clean broken ones
                const clonedImages = clonedDoc.querySelectorAll('img');
                clonedImages.forEach((img) => {
                    const src = img.getAttribute('src');
                    // Remove broken/empty images
                    if (!src || src.trim() === '') {
                        img.style.display = 'none';
                        img.removeAttribute('src');
                        return;
                    }
                    // Proxy S3 images through same-origin API to bypass CORS
                    if (isExternalS3Url(src)) {
                        img.removeAttribute('crossorigin');
                        img.setAttribute('src', proxyImageUrl(src));
                    }
                });
            },
        });
        
        const dataUrl = canvas.toDataURL("image/png");
        console.log("[Capture] html2canvas capture successful!");
        return dataUrl;
    } catch (h2cError: any) {
        console.warn("[Capture] html2canvas failed, attempting html-to-image fallback...", h2cError?.message || h2cError);
    }

    // 3. Fallback to html-to-image if html2canvas fails
    // IMPORTANT: We do NOT modify the live DOM. All processing happens on the clone.
    try {
        // Create a deep clone of the element
        const clone = element.cloneNode(true) as HTMLElement;

        // Create an off-screen container for the clone
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = element.offsetWidth + "px";
        container.style.height = element.offsetHeight + "px";
        container.style.overflow = "hidden";
        container.style.pointerEvents = "none";
        container.style.fontFamily = window.getComputedStyle(element).fontFamily;
        
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
            console.log("[Capture] Processing cloned elements for html-to-image fallback...");

            // Remove problematic elements unsupported by foreignObject rendering
            const elementsToRemove = clone.querySelectorAll("iframe, video, script, audio");
            elementsToRemove.forEach(el => el.remove());

            // Process images in the clone (not the live DOM!)
            processClonedImages(clone);

            // Neutralize unsupported computed styles
            neutralizeComputedStyles(clone);

            console.log("[Capture] Generating high-resolution PNG via html-to-image...");
            const dataUrl = await toPng(clone, {
                width: element.offsetWidth,
                height: element.offsetHeight,
                pixelRatio: 2,
                cacheBust: true,
                skipFonts: true,
                backgroundColor: "#ffffff",
                style: {
                    transform: 'none',
                    transformOrigin: 'top left',
                }
            });

            console.log("[Capture] html-to-image capture successful!");
            return dataUrl;
        } finally {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    } catch (fallbackError: any) {
        const errInfo = {
            message: fallbackError?.message,
            name: fallbackError?.name,
            stack: fallbackError?.stack,
            toString: fallbackError?.toString?.(),
            type: typeof fallbackError,
            keys: fallbackError && typeof fallbackError === 'object' ? Object.keys(fallbackError) : null,
            raw: fallbackError
        };
        console.error("[Capture] Critical error during fallback poster capture:", errInfo);
        throw fallbackError;
    }
}
