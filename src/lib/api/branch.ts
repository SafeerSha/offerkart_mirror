import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export async function addBranch(shopId: string, data: any) {
    const endpoint = ENDPOINTS.BRANCH.BASE(shopId);

    return await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateBranch(shopId: string, branchId: string, data: any) {
    const endpoint = ENDPOINTS.BRANCH.DETAILS(shopId, branchId);

    return await apiClient(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function getBranches(shopId: string) {
    const endpoint = ENDPOINTS.BRANCH.BASE(shopId);

    return await apiClient(endpoint, {
        method: "GET",
    });
}

export async function getBranchDetails(shopId: string, branchId: string) {
    const endpoint = ENDPOINTS.BRANCH.DETAILS(shopId, branchId);

    return await apiClient(endpoint, {
        method: "GET",
    });
}

export async function deleteBranch(shopId: string, branchId: string) {
    const endpoint = ENDPOINTS.BRANCH.DETAILS(shopId, branchId);

    return await apiClient(endpoint, {
        method: "DELETE",
    });
}
