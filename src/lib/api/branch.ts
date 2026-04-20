import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";

export async function addBranch(shopId: string, data: any) {
    return await backend.post(ENDPOINTS.BRANCH.BASE(shopId), data);
}

export async function updateBranch(shopId: string, branchId: string, data: any) {
    return await backend.put(ENDPOINTS.BRANCH.DETAILS(shopId, branchId), data);
}

export async function getBranches(shopId: string) {
    return await backend.get(ENDPOINTS.BRANCH.BASE(shopId));
}

export async function getBranchDetails(shopId: string, branchId: string) {
    return await backend.get(ENDPOINTS.BRANCH.DETAILS(shopId, branchId));
}

export async function deleteBranch(shopId: string, branchId: string) {
    return await backend.delete(ENDPOINTS.BRANCH.DETAILS(shopId, branchId));
}
