import { s3Api } from "./api/s3";
import { extractS3Url } from "./common";

/**
 * Returns the input HTTP URL directly, or uploads a base64 image to S3 and returns the resulting S3 URL.
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
            const uploadedUrl = extractS3Url(response);

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

export const compressImage = (file: File, maxSizeKB: number = 100): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (file.size <= maxSizeKB * 1024) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                const maxDim = 1200;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return reject(new Error("Could not get 2D context from canvas"));
                }

                ctx.drawImage(img, 0, 0, width, height);

                const tryCompress = (quality: number): void => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                return reject(new Error("Canvas toBlob returned null"));
                            }

                            if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                    type: "image/webp",
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                tryCompress(quality - 0.15);
                            }
                        },
                        "image/webp",
                        quality
                    );
                };
                tryCompress(0.85);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * A centralized utility to clean up unused images from S3.
 * It filters out invalid, local, or placeholder URLs before sending the delete request.
 * 
 * @param urls Array of image URLs to delete
 * @returns Array of promise results for each deletion
 */
export async function cleanupImages(urls: (string | null | undefined)[]) {
    const validUrls = urls.filter((url): url is string => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('/images/') || url.startsWith('/')) return false;
        if (url.includes('unsplash.com')) return false;
        return url.startsWith('http');
    });

    const uniqueUrls = [...new Set(validUrls)];

    if (uniqueUrls.length === 0) {
        return [];
    }

    console.log(`[Image Cleanup] Deleting ${uniqueUrls.length} image(s)...`, uniqueUrls);

    const results = await Promise.allSettled(
        uniqueUrls.map(url => s3Api.deleteImage(url))
    );

    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`[Image Cleanup] Failed to delete image: ${uniqueUrls[index]}`, result.reason);
        }
    });

    return results;
}

/**
 * Helper to safely extract all possible image URLs from an Offer object and delete them.
 */
export async function cleanupOfferImages(offer: any) {
    if (!offer) return [];
    
    const urlsToCleanup = [
        offer.posterSrc,
        offer.image,
        ...(offer.posters?.map((p: any) => p.posterSrc) || []),
        ...(offer.posters?.map((p: any) => p.image) || [])
    ];

    return cleanupImages(urlsToCleanup);
}

/**
 * Helper to safely extract all possible image URLs from a Product object and delete them.
 */
export async function cleanupProductImages(product: any) {
    if (!product) return [];
    
    const urlsToCleanup = [
        product.image,
        ...(product.images || []) // If multiple images are supported
    ];

    return cleanupImages(urlsToCleanup);
}

/**
 * Normalizes and resolves a shop logo URL from shop and user objects.
 * Inspects all common property variations, strips stringified "null" / "undefined",
 * and automatically formats relative S3 keys into fully qualified URLs.
 */
export function resolveShopLogoUrl(shop?: any, user?: any): string | undefined {
    if (!shop && !user) return undefined;

    const raw =
        shop?.logo_url ||
        shop?.logo ||
        shop?.shop_logo ||
        shop?.shopLogo ||
        shop?.logoUrl ||
        shop?.image ||
        user?.logo_url ||
        user?.shop_logo ||
        user?.image ||
        null;

    if (!raw || typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return undefined;

    // Absolute HTTP(S) URLs or root-relative paths
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
        return trimmed;
    }

    // Relative S3 keys (e.g. "shops/1/logo.png" or "uploads/logo.jpg")
    const s3Domain = process.env.NEXT_PUBLIC_S3_DOMAIN || "offersnearu.s3.eu-north-1.amazonaws.com";
    return `https://${s3Domain}/${trimmed.replace(/^\/+/, "")}`;
}

