// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface RegisterShopRequest {
    name: string;
    companyName: string;
    phone: string;
    email: string;
    state: string;
    district: string;
    locality: string;
    message: string;
}

export async function registerShop(data: RegisterShopRequest) {
    console.log("Registering shop:", data);
    await delay(1500); // Simulate network latency

    // In a real app, this would be a POST request to your backend
    return {
        success: true,
        message: "Shop registration request submitted successfully!",
    };
}
