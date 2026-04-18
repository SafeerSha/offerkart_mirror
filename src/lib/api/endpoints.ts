export const ENDPOINTS = {
    AUTH: {
        REGISTER: `business/auth/register`,
        LOGIN: `business/auth/login`,
    },
    SHOP: {
        BASE: `business/shop`,
        MY_SHOPS: `business/shop/my-shops`,
        DETAILS: (id: string) => `business/shop/${id}`,
    },
    BRANCH: {
        BASE: (shopId: string) => `business/shop/${shopId}/branches`,
        DETAILS: (shopId: string, branchId: string) => `business/shop/${shopId}/branches/${branchId}`,
    },
    S3_IMAGE: {
        BASE: `business/image`,
        UPLOAD: `business/image/upload`,
    },
    OFFER: {
        BASE: `business/offer`,
        DETAILS: (id: string) => `business/offer/${id}`,
        INACTIVATE: (id: string) => `business/offer/inactivate/${id}`,
    },
    USER_OFFER: {
        BASE: `user/offer`,
    }
};

