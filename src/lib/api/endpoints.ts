export const API_BASE_URL = "/api/proxy";
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
        BASE: (shopId: string) => `${API_BASE_URL}/business/shop/${shopId}/branch`,
        DETAILS: (shopId: string, branchId: string) => `${API_BASE_URL}/business/shop/${shopId}/branch/${branchId}`,
    }
};
