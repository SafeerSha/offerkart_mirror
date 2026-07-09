import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const email = `test-merchant-${Date.now()}@example.com`;
        const password = "Password123!";

        // 1. Register
        console.log("Registering...");
        const regRes = await fetch("https://offersnearu.vercel.app/api/business/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test Merchant", email, password })
        });
        
        let regData;
        try {
            regData = await regRes.json();
        } catch (e: any) {
            regData = { error: "Failed to parse JSON", text: await regRes.text() };
        }

        // 2. Login
        console.log("Logging in...");
        const loginRes = await fetch("https://offersnearu.vercel.app/api/business/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        let loginData;
        try {
            loginData = await loginRes.json();
        } catch (e: any) {
            loginData = { error: "Failed to parse JSON", text: await loginRes.text() };
        }
        
        const token = loginData.data?.accessToken;
        if (!token) {
            return NextResponse.json({ error: "Failed to login", loginData, regData });
        }

        // 3. Create Shop
        console.log("Creating shop...");
        const formData = new FormData();
        formData.append("shop_name", "Test Dynamic Shop");
        formData.append("address", "123 Test Street");
        formData.append("city", "Kochi");
        formData.append("district", "Ernakulam");
        formData.append("state", "Kerala");
        formData.append("pincode", "682001");
        formData.append("latitude", "9.9312");
        formData.append("longitude", "76.2673");
        formData.append("is_active", "true");
        
        // Append all possible industry field name variations
        formData.append("industry_id", "2");
        formData.append("industryId", "2");
        formData.append("industry", "2");

        const shopRes = await fetch("https://offersnearu.vercel.app/api/business/shop", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        
        let shopData;
        try {
            shopData = await shopRes.json();
        } catch (e: any) {
            shopData = { error: "Failed to parse JSON", text: await shopRes.text() };
        }
        
        const shopId = shopData.data?.id;

        let detailsData = null;
        if (shopId) {
            // 4. Get Shop Details
            console.log("Getting details...");
            const detailsRes = await fetch(`https://offersnearu.vercel.app/api/business/shop/${shopId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            try {
                detailsData = await detailsRes.json();
            } catch (e: any) {
                detailsData = { error: "Failed to parse JSON", text: await detailsRes.text() };
            }
        }

        return NextResponse.json({
            success: true,
            regData,
            loginData,
            shopData,
            detailsData
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack });
    }
}
