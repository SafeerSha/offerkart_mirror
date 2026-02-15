/**
 * Security utilities for input sanitization and attack prevention
 */

/**
 * Basic XSS Sanitization
 * Strips HTML tags and suspicious attributes
 */
export function sanitizeInput(value: string): string {
    if (typeof value !== "string") return value;

    // Remove HTML tags
    const clean = value.replace(/<[^>]*>?/gm, "");

    // Simple encoding for special characters that could break out of attributes
    return clean
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Suspicious Pattern Detection (Basic SQLi and Shell awareness)
 * Returns true if the input contains common attack markers
 */
export function hasSuspiciousPattern(value: string): boolean {
    if (typeof value !== "string") return false;

    const patterns = [
        /(\s|^)OR\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i, // Basic SQLi
        /UNION\s+SELECT/i,
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /--/g, // SQL comment
        /;/g,   // Statement separator
        /\/\*/g, // Multi-line comment start
        /xp_cmdshell/i,
    ];

    return patterns.some(pattern => pattern.test(value));
}

/**
 * Recursive Payload Sanitizer
 * Cleans all string properties in an object deeply
 */
export function sanitizePayload<T>(data: T): T {
    if (data === null || data === undefined) return data;

    if (typeof data === "string") {
        return sanitizeInput(data) as unknown as T;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizePayload(item)) as unknown as T;
    }

    if (typeof data === "object") {
        const sanitized = {} as any;
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizePayload(value);
        }
        return sanitized as T;
    }

    return data;
}
