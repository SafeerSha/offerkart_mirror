/**
 * Centralized common helper functions.
 */

/**
 * Extracts the uploaded S3 image URL from standard API response shapes.
 */
export function extractS3Url(response: any): string | null {
    if (!response) return null;
    const payload = response.data?.data || response.data;
    return (
        payload?.url ||
        payload?.fileUrl ||
        payload?.imageUrl ||
        response.data?.imageUrl ||
        (typeof payload === "string" ? payload : null)
    );
}

/**
 * Formats a date into a short string representation: 'DD/MM' (e.g. '15/09').
 */
export function formatShortDate(date: string | Date | number | undefined | null): string {
    if (!date) return "";
    const parsed = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}
