import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MobileHandoffCard } from "@/components/shop-manager/MobileHandoffCard";

// Mock QRCode.toDataURL to avoid canvas/native dependencies in JSDOM
vi.mock("qrcode", () => ({
    default: {
        toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockQrCodeDataUrl"),
    },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("MobileHandoffCard Component", () => {
    beforeEach(() => {
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("renders guidance banner when shopId is missing", () => {
        render(<MobileHandoffCard shopId={null} capturedCount={0} />);
        expect(
            screen.getByText(/Save basic shop details/i)
        ).toBeTruthy();
        expect(
            screen.getByText(/Basic Details/i)
        ).toBeTruthy();
    });

    it("renders QR code instructions, Copy Link and WhatsApp Share buttons when shopId is present", async () => {
        render(
            <MobileHandoffCard
                shopId="shop-123"
                shopName="Fresh Supermarket"
                capturedCount={1}
                totalCount={3}
            />
        );

        expect(
            screen.getByText(/Scan QR Code with Your Phone/i)
        ).toBeTruthy();
        expect(screen.getByText(/Copy Mobile Link/i)).toBeTruthy();
        expect(screen.getByText(/Share via WhatsApp/i)).toBeTruthy();

        // Wait for QR code image to render
        await waitFor(() => {
            const qrImg = screen.getByAltText(/Scan QR code to open verification on mobile/i);
            expect(qrImg).toBeTruthy();
        });
    });

    it("copies mobile verification URL with #storefront-photos anchor to clipboard", async () => {
        render(
            <MobileHandoffCard
                shopId="shop-abc"
                shopName="My Store"
                capturedCount={0}
            />
        );

        await waitFor(() => {
            expect(screen.getByAltText(/Scan QR code to open verification on mobile/i)).toBeTruthy();
        });

        const copyBtn = screen.getByText(/Copy Mobile Link/i);
        fireEvent.click(copyBtn);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("/shop-manager/add-shop?id=shop-abc&tab=verification#storefront-photos")
        );
    });

    it("triggers onRefresh callback when clicking the sync button", async () => {
        const onRefresh = vi.fn();
        render(
            <MobileHandoffCard
                shopId="shop-abc"
                capturedCount={1}
                onRefresh={onRefresh}
            />
        );

        await waitFor(() => {
            expect(screen.getByAltText(/Scan QR code to open verification on mobile/i)).toBeTruthy();
        });

        const syncBtn = screen.getByTitle(/Check if photos were captured on phone/i);
        fireEvent.click(syncBtn);

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("keeps QR code statically visible and shows Ready badge when all photos are captured", async () => {
        render(
            <MobileHandoffCard
                shopId="shop-abc"
                capturedCount={3}
                totalCount={3}
            />
        );

        // Should display the static retake heading and Ready badge
        expect(screen.getByText(/Captured via Mobile · Scan QR to Retake/i)).toBeTruthy();
        expect(screen.getByText(/3\/3 Ready/i)).toBeTruthy();

        // QR code should remain visible statically
        await waitFor(() => {
            expect(screen.getByAltText(/Scan QR code to open verification on mobile/i)).toBeTruthy();
        });
    });
});
