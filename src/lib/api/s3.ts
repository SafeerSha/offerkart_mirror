import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { ApiResponse } from "../types/api";
import imageCompression from "browser-image-compression";

const S3_BUCKET_HOST = "offersnearu.s3.eu-north-1.amazonaws.com";

function isOwnS3Url(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === S3_BUCKET_HOST;
  } catch {
    return false;
  }
}

export const s3Api = {
    /**
     * Upload an image to S3 with automatic client-side compression.
     * @param file The file object from an input element
     */
    uploadImage: async (file: File, folder?: string): Promise<ApiResponse<{ url: string }>> => {
        const performUpload = async (fileToUpload: File | Blob): Promise<ApiResponse<{ url: string }>> => {
            const formData = new FormData();
            formData.append("file", fileToUpload);
            if (folder) {
                formData.append("folder", folder);
            }

            // Note: backendClient wraps the upstream JSON response into ApiResponse.data.
            // Upstream may return either `{ url | imageUrl }` or `{ success, data: { url | imageUrl } }`.
            const response = await backend.post<{
                url?: string;
                imageUrl?: string;
                message?: string;
                data?: { url?: string; imageUrl?: string };
            }>(ENDPOINTS.S3_IMAGE.UPLOAD, formData);

            const payload = response.data;
            const extractedUrl =
                payload?.url ||
                payload?.imageUrl ||
                payload?.data?.url ||
                payload?.data?.imageUrl ||
                "";
             
            // Normalize response so consumer always gets a consistent .url property
            if (response.success) {
                return {
                    ...response,
                    message: response.message || payload?.message,
                    data: {
                        url: extractedUrl,
                    }
                } as ApiResponse<{ url: string }>;
            }
             
            return response as ApiResponse<{ url: string }>;
        };

        try {
            // Compression options
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);
            return await performUpload(compressedFile);
        } catch (error) {
            console.error("Image compression failed, uploading original:", error);
            return await performUpload(file);
        }
    },


    /**
     * Get a list of uploaded images.
     */
    getImages: async (): Promise<ApiResponse<any>> => {
        return backend.get(ENDPOINTS.S3_IMAGE.BASE);
    },

    /**
     * Delete an image from S3 by its URL.
     * @param url The full S3 URL of the image to delete
     *
     * SECURITY: The upstream backend MUST verify that the image belongs to the
     * authenticated user's shop before deleting. This client-side guard only
     * ensures the URL matches our known bucket domain; it does NOT authorize deletion.
     */
    deleteImage: async (url: string): Promise<ApiResponse<any>> => {
        if (!isOwnS3Url(url)) {
            return {
                success: false,
                message: "Refused to delete: URL does not match the project S3 bucket.",
                data: null,
            } as ApiResponse<any>;
        }

        return backend.delete(ENDPOINTS.S3_IMAGE.BASE, {
            body: JSON.stringify({ url }), // JSON payload as per cURL spec
        });
    },
};
