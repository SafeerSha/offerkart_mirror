import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";
import { ApiResponse } from "../types/api";

export const s3Api = {
    /**
     * Upload an image to S3.
     * @param file The file object from an input element
     */
    uploadImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
        const formData = new FormData();
        formData.append("file", file);

        return apiClient<{ url: string }>(ENDPOINTS.S3_IMAGE.UPLOAD, {
            method: "POST",
            body: formData,
        });
    },

    /**
     * Get a list of uploaded images.
     */
    getImages: async (): Promise<ApiResponse<any>> => {
        return apiClient(ENDPOINTS.S3_IMAGE.BASE, {
            method: "GET",
        });
    },

    /**
     * Delete an image from S3 by its URL.
     * @param url The full S3 URL of the image to delete
     */
    deleteImage: async (url: string): Promise<ApiResponse<any>> => {
        return apiClient(ENDPOINTS.S3_IMAGE.BASE, {
            method: "DELETE",
            body: JSON.stringify({ url }), // JSON payload as per cURL spec
        });
    },
};
