const VISITOR_ID_KEY = "ok_visitor_id";
function generateId(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    // Fallback: manual UUID v4 using crypto.getRandomValues
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // Last resort fallback
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Returns the persistent visitor ID for this browser.
 * Creates and stores one if it doesn't exist yet.
 */
export function getVisitorId(): string {
    if (typeof window === "undefined") return "";

    try {
        let id = localStorage.getItem(VISITOR_ID_KEY);
        if (!id) {
            id = generateId();
            localStorage.setItem(VISITOR_ID_KEY, id);
        }
        return id;
    } catch {
        // localStorage may be blocked (e.g. private browsing in some browsers)
        return generateId();
    }
}
