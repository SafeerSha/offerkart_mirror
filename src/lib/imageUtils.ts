import { s3Api } from "./api/s3";

/**
 * Takes an image reference (URL, base64, or null) and ensures it is an external S3 URL.
 * If the input is already an HTTP URL, returns it as is.
 * If it is a base64 data URL, uploads it to S3 first, then returns the final URL.
 */
export const ensureS3Url = async (imageUrl: string | null | undefined, fallbackFilename: string = "product-image.png"): Promise<string | null> => {
    if (!imageUrl) return null;

    // If it's already an http(s) link, return it.
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) {
        return imageUrl;
    }

    // If it is a base64 string
    if (imageUrl.startsWith("data:image")) {
        try {
            const parts = imageUrl.split(",");
            const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            // Transform to a File object that s3Api can digest
            const file = new File([blob], fallbackFilename, { type: mime });
            
            const response = await s3Api.uploadImage(file);
            
            // Standard handle of various response shapes seen in code base
            const payload = (response?.data as any)?.data || response?.data;
            const uploadedUrl = payload?.url || payload?.fileUrl || payload?.imageUrl || (response?.data as any)?.imageUrl || (typeof payload === 'string' ? payload : null);

            if (response.success && uploadedUrl) {
                return uploadedUrl;
            } else {
                console.error("Failed to upload base64 image to S3 during sanitation:", response.message);
                // Fallback to input, although discouraged.
                return imageUrl; 
            }
        } catch (error) {
            console.error("Error converting/uploading base64 image during sanitation:", error);
            return imageUrl;
        }
    }

    return imageUrl;
};
