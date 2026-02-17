import { apiClient } from "./apiClient";
import { RegisterShopRequest, LoginShopRequest, LoginResponse } from "../types/auth";
import { ENDPOINTS } from "./endpoints";

export async function registerShop(data: RegisterShopRequest) {
    const endpoint = ENDPOINTS.AUTH.REGISTER;

    return await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function loginShop(data: LoginShopRequest) {
    const endpoint = ENDPOINTS.AUTH.LOGIN;

    return await apiClient<LoginResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function addShop(data: FormData | any) {
    const endpoint = ENDPOINTS.SHOP.BASE;

    return await apiClient(endpoint, {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
}

export async function updateShop(shopId: string, data: FormData | any) {
    const endpoint = ENDPOINTS.SHOP.DETAILS(shopId);

    return await apiClient(endpoint, {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
}

export async function getShops() {
    const endpoint = ENDPOINTS.SHOP.BASE;

    return await apiClient(endpoint, {
        method: "GET",
    });
}

export async function getMyShops() {
    const endpoint = ENDPOINTS.SHOP.MY_SHOPS;

    return await apiClient(endpoint, {
        method: "GET",
    });
}

export async function getShopDetails(shopId: string) {
    const endpoint = ENDPOINTS.SHOP.DETAILS(shopId);

    return await apiClient(endpoint, {
        method: "GET",
    });
}
