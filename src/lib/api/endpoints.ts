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
        DETAILS: (id: string | number) => `user/offer/${id}`,
        SIMILAR: (id: string | number) => `user/offer/${id}/similar`,
        IDS: `user/offer/ids`,
        PRODUCTS: `user/offer/products`,
        PRODUCT_DETAILS: (id: string | number) => `user/offer/products/${id}`,
        PRODUCT_SIMILAR: (id: string | number) => `user/offer/products/${id}/similar`,
        SHOPS: `user/offer/shops`,
    },
    CATEGORY: {
        BASE: `business/category`,
        SUBCATEGORIES: (id: string | number) => `business/category/${id}/subcategories`,
        ALL_SUBCATEGORIES: `business/category/subcategories`,
    },
    INDUSTRY: {
        BASE: `business/industry`,
    },
    OFFER_PRODUCT: {
        BASE: `business/offerproduct`,
        DETAILS: (id: string) => `business/offerproduct/${id}`,
        INACTIVATE: (id: string) => `business/offerproduct/inactivate/${id}`,
    }
};

