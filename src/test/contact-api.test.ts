import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/contact/route";
import { NextRequest } from "next/server";

describe("Platform Contact API Route", () => {
    it("successfully processes valid contact submissions", async () => {
        const payload = {
            firstName: "Alex",
            lastName: "Merchant",
            email: "alex@localstore.com",
            businessName: "Alex Bakery",
            phone: "+15559876543",
            message: "We would like to register our local bakery and launch weekend flash sales."
        };

        const request = new NextRequest("http://localhost:3000/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.ticketId).toBeDefined();
        expect(data.message).toContain("Alex");
    });

    it("rejects contact submission with invalid email", async () => {
        const payload = {
            firstName: "Alex",
            lastName: "Merchant",
            email: "not-an-email",
            message: "We would like to register our shop on OfferKart."
        };

        const request = new NextRequest("http://localhost:3000/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors?.email).toBeDefined();
    });

    it("rejects contact submission with message shorter than 10 characters", async () => {
        const payload = {
            firstName: "Alex",
            lastName: "Merchant",
            email: "alex@store.com",
            message: "Too short"
        };

        const request = new NextRequest("http://localhost:3000/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors?.message).toBeDefined();
    });

    it("rejects empty request body", async () => {
        const request = new NextRequest("http://localhost:3000/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: ""
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
    });
});
