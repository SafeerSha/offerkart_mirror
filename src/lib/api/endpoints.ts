export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const ENDPOINTS = {
    AUTH: {
        REGISTER: `${API_BASE_URL}/business/auth/register`,
        LOGIN: `${API_BASE_URL}/business/auth/login`,
    },
    SHOP: {
        BASE: `${API_BASE_URL}/business/shop`,
        MY_SHOPS: `${API_BASE_URL}/business/shop/my-shops`,
        DETAILS: (id: string) => `${API_BASE_URL}/business/shop/${id}`,
    },
    BRANCH: {
        BASE: (shopId: string) => `${API_BASE_URL}/business/shop/${shopId}/branches`,
        DETAILS: (shopId: string, branchId: string) => `${API_BASE_URL}/business/shop/${shopId}/branches/${branchId}`,
    },
    S3_IMAGE: {
        BASE: `${API_BASE_URL}/business/image`,
        UPLOAD: `${API_BASE_URL}/business/image/upload`,
    }
};
