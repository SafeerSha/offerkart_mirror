import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveCameraModal } from "@/components/shop-manager/LiveCameraModal";

describe("LiveCameraModal Component", () => {
    let mockTracks: any[];
    let mockStream: any;
    let getUserMediaMock: any;

    beforeEach(() => {
        mockTracks = [
            {
                stop: vi.fn(),
                kind: "video",
                enabled: true,
            },
        ];

        mockStream = {
            getTracks: vi.fn(() => mockTracks),
            getVideoTracks: vi.fn(() => mockTracks),
        };

        getUserMediaMock = vi.fn().mockResolvedValue(mockStream);

        // Mock navigator.mediaDevices
        Object.defineProperty(navigator, "mediaDevices", {
            writable: true,
            value: {
                getUserMedia: getUserMediaMock,
                enumerateDevices: vi.fn().mockResolvedValue([
                    { kind: "videoinput", deviceId: "cam1" },
                    { kind: "videoinput", deviceId: "cam2" },
                ]),
            },
        });

        // Mock window.isSecureContext
        Object.defineProperty(window, "isSecureContext", {
            writable: true,
            value: true,
        });

        // Mock HTMLMediaElement.prototype.play
        vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("renders nothing when isOpen is false", () => {
        const { container } = render(
            <LiveCameraModal
                isOpen={false}
                onClose={vi.fn()}
                onCapture={vi.fn()}
                title="Shop Exterior"
                description="Entrance facade"
                categoryKey="SHOP_EXTERIOR"
            />
        );

        expect(container.firstChild).toBeNull();
        expect(getUserMediaMock).not.toHaveBeenCalled();
    });

    it("initializes in-browser camera with moderate resolution and rear facing mode", async () => {
        render(
            <LiveCameraModal
                isOpen={true}
                onClose={vi.fn()}
                onCapture={vi.fn()}
                title="Shop Exterior"
                description="Entrance facade"
                categoryKey="SHOP_EXTERIOR"
            />
        );

        expect(screen.getByText("Shop Exterior")).toBeDefined();

        await waitFor(() => {
            expect(getUserMediaMock).toHaveBeenCalledWith({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
        });
    });

    it("displays error guidance and gallery fallback when camera permission is denied", async () => {
        const permissionError = new Error("Permission denied");
        permissionError.name = "NotAllowedError";
        getUserMediaMock.mockRejectedValueOnce(permissionError);

        const onFallbackToGallery = vi.fn();

        render(
            <LiveCameraModal
                isOpen={true}
                onClose={vi.fn()}
                onCapture={vi.fn()}
                title="Shop Exterior"
                description="Entrance facade"
                categoryKey="SHOP_EXTERIOR"
                onFallbackToGallery={onFallbackToGallery}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Camera Access Required")).toBeDefined();
        });

        expect(screen.getByText(/Camera permission was denied/i)).toBeDefined();
        expect(screen.getByText("Retry Camera")).toBeDefined();

        const galleryBtn = screen.getByText("Choose from Gallery Instead");
        expect(galleryBtn).toBeDefined();

        fireEvent.click(galleryBtn);
        expect(onFallbackToGallery).toHaveBeenCalled();
    });

    it("stops all stream tracks when closed", async () => {
        const onClose = vi.fn();

        const { unmount } = render(
            <LiveCameraModal
                isOpen={true}
                onClose={onClose}
                onCapture={vi.fn()}
                title="Shop Exterior"
                description="Entrance facade"
                categoryKey="SHOP_EXTERIOR"
            />
        );

        await waitFor(() => {
            expect(getUserMediaMock).toHaveBeenCalled();
        });

        // Unmount component to test cleanup
        unmount();

        expect(mockTracks[0].stop).toHaveBeenCalled();
    });
});

