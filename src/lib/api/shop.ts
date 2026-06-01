import { backend } from "./backendClient";
import { RegisterShopRequest, LoginShopRequest } from "../types/auth";
import { ENDPOINTS } from "./endpoints";
import { AuthLoginData } from "../types/auth";

export async function registerShop(data: RegisterShopRequest) {
    return await backend.post(ENDPOINTS.AUTH.REGISTER, data);
}

export async function loginShop(data: LoginShopRequest) {
    return await backend.post<AuthLoginData>(ENDPOINTS.AUTH.LOGIN, data);
}

export async function addShop(data: FormData | any) {
    return await backend.post(ENDPOINTS.SHOP.BASE, data);
}

export async function updateShop(shopId: string, data: FormData | any) {
    return await backend.put(ENDPOINTS.SHOP.DETAILS(shopId), data);
}

export async function getShops() {
    return await backend.get(ENDPOINTS.SHOP.BASE);
}

export async function getMyShops() {
    return await backend.get(ENDPOINTS.SHOP.MY_SHOPS);
}

export async function getShopDetails(shopId: string) {
    return await backend.get(ENDPOINTS.SHOP.DETAILS(shopId));
}
