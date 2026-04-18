const IS_SERVER = typeof window === 'undefined';
export const API_BASE_URL = IS_SERVER 
    ? 'https://offersnearu.vercel.app/api' 
    : '/api/backend';

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
    },
    OFFER: {
        BASE: `${API_BASE_URL}/business/offer`,
        DETAILS: (id: string) => `${API_BASE_URL}/business/offer/${id}`,
        INACTIVATE: (id: string) => `${API_BASE_URL}/business/offer/inactivate/${id}`,
    },
    USER_OFFER: {
        BASE: `${API_BASE_URL}/user/offer`,
    }
};
