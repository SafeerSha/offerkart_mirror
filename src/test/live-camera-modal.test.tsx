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
            stop: vi.fn(),
            removeTrack: vi.fn(),
            getTracks: vi.fn(() => mockTracks),
            getVideoTracks: vi.fn(() => mockTracks),
            getAudioTracks: vi.fn(() => []),
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
            expect(getUserMediaMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    video: expect.objectContaining({
                        facingMode: { ideal: "environment" },
                    }),
                })
            );
        });
    });

    it("displays error guidance and retry button when camera permission is denied", async () => {
        const permissionError = new Error("Permission denied");
        permissionError.name = "NotAllowedError";
        getUserMediaMock.mockRejectedValue(permissionError);

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

        await waitFor(() => {
            expect(screen.getByText("Camera Access Required")).toBeDefined();
        });

        expect(screen.getByText(/Camera permission was denied/i)).toBeDefined();
        expect(screen.getByText("Retry Camera Permission")).toBeDefined();
        // Gallery fallback must not be present
        expect(screen.queryByText("Choose from Gallery Instead")).toBeNull();
    });

    it("stops all stream tracks when unmounted or closed", async () => {
        const { unmount } = render(
            <LiveCameraModal
                isOpen={true}
                onClose={vi.fn()}
                onCapture={vi.fn()}
                title="Shop Exterior"
                description="Entrance facade"
                categoryKey="SHOP_EXTERIOR"
            />
        );

        await waitFor(() => {
            expect(getUserMediaMock).toHaveBeenCalled();
        });

        unmount();

        // Either mockStream.stop or mockTracks[0].stop must be invoked
        expect(mockTracks[0].stop.mock.calls.length + mockStream.stop.mock.calls.length).toBeGreaterThan(0);
    });
});
