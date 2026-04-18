import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { ApiResponse } from "../types/api";
import imageCompression from "browser-image-compression";

export const s3Api = {
    /**
     * Upload an image to S3 with automatic client-side compression.
     * @param file The file object from an input element
     */
    uploadImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
        try {
            // Compression options
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);
            
            const formData = new FormData();
            formData.append("file", compressedFile);

            return backend.post<{ url: string }>(ENDPOINTS.S3_IMAGE.UPLOAD, formData);
        } catch (error) {
            console.error("Image compression failed, uploading original:", error);
            
            const formData = new FormData();
            formData.append("file", file);

            return backend.post<{ url: string }>(ENDPOINTS.S3_IMAGE.UPLOAD, formData);
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
     */
    deleteImage: async (url: string): Promise<ApiResponse<any>> => {
        return backend.delete(ENDPOINTS.S3_IMAGE.BASE, {
            body: JSON.stringify({ url }), // JSON payload as per cURL spec
        });
    },
};
