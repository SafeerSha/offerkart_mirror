export function sanitizeInput(value: string): string {
    if (typeof value !== "string") return value;

    // Strip executable HTML tags and script/style tags, while keeping standard text untouched.
    // React handles JSX entity escaping automatically upon rendering.
    return value
        .replace(/<script\b[^<]*>(?:[\s\S]*?<\/script>)?/gi, "")
        .replace(/<style\b[^<]*>(?:[\s\S]*?<\/style>)?/gi, "")
        .replace(/<[^>]*>/g, "");
}

export function hasSuspiciousPattern(value: string): boolean {
    if (typeof value !== "string") return false;

    const patterns = [
        /(\s|^)OR\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
        /UNION\s+ALL\s+SELECT|UNION\s+SELECT/i,
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /INSERT\s+INTO/i,
        /UPDATE\s+\w+\s+SET/i,
        /xp_cmdshell/i,
        /<script/i,
    ];

    return patterns.some(pattern => pattern.test(value));
}

export function sanitizePayload<T>(data: T, key?: string): T {
    if (data === null || data === undefined) return data;

    // Skip HTML sanitization for fields holding JSON strings (like rawDesigner)
    if (key === "rawDesigner") {
        return data;
    }

    if (typeof data === "string") {
        return sanitizeInput(data) as unknown as T;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizePayload(item, key)) as unknown as T;
    }

    if (typeof data === "object") {
        const sanitized = {} as any;
        for (const [k, value] of Object.entries(data)) {
            sanitized[k] = sanitizePayload(value, k);
        }
        return sanitized as T;
    }

    return data;
}
