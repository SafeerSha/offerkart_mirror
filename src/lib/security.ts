export function sanitizeInput(value: string): string {
    if (typeof value !== "string") return value;

    const clean = value.replace(/<[^>]*>?/gm, "");
    return clean
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function hasSuspiciousPattern(value: string): boolean {
    if (typeof value !== "string") return false;

    const patterns = [
        /(\s|^)OR\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
        /UNION\s+SELECT/i,
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /--/g,
        /;/g,
        /\/\*/g,
        /xp_cmdshell/i,
    ];

    return patterns.some(pattern => pattern.test(value));
}

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
