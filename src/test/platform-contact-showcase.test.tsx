import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopRegistrationSection from "@/components/home/ShopRegistrationSection";
import TutorialMediaPlayer from "@/components/showcase/TutorialMediaPlayer";
import ContactAndJourneyPage from "@/app/contact/page";
import { OFFICIAL_PLATFORM_CONTACT, TUTORIAL_CHAPTERS } from "@/lib/tutorialData";

// Mock IntersectionObserver for Framer Motion viewport triggers
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver
});
Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver
});

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: null,
        status: "unauthenticated"
    })
}));

// Mock framer-motion to simplify DOM testing
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        useScroll: () => ({
            scrollYProgress: {
                get: () => 0,
                onChange: vi.fn(),
                on: vi.fn()
            }
        }),
        useMotionValueEvent: vi.fn()
    };
});

describe("Epic: Platform Contact & Registration Tutorial", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Story 1: Registration and Showcase Navigation", () => {
        it("AC-1.1: Users can view a clear call-to-action in the business growth section leading to the platform registration and showcase page", () => {
            render(<ShopRegistrationSection />);

            // Check the clear CTA button exists
            const showcaseCta = screen.getByTestId("showcase-tutorial-cta");
            expect(showcaseCta).toBeDefined();
            expect(showcaseCta.textContent).toContain("Platform Tutorial & Showcase");

            // AC-1.2: When the user selects the navigation action, the system redirects them to the dedicated functionality showcase page
            expect(showcaseCta.getAttribute("href")).toBe("/contact");
        });

        it("AC-1.3: The showcase page clearly presents the core registration flow and functionality previews", () => {
            render(<ContactAndJourneyPage />);

            // Verify showcase header
            expect(screen.getByText(/Built to Scale/i)).toBeDefined();

            // Verify the stages of the registration & growth workflow are clearly presented
            expect(screen.getAllByText(/Quick Registration/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Create Irresistible Offers/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Upload Marketing Posters/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Go Live & Get Discovered/i).length).toBeGreaterThan(0);
        });
    });

    describe("Story 2: Platform Contact Integration", () => {
        it("AC-2.1: Users can view official platform contact information and available communication channels within the business growth section", () => {
            render(<ShopRegistrationSection />);

            // Official platform contact section is present
            const contactSection = screen.getByTestId("business-growth-contact-channels");
            expect(contactSection).toBeDefined();

            // Official contact information displayed
            expect(screen.getByText(OFFICIAL_PLATFORM_CONTACT.formattedPhone)).toBeDefined();
            expect(screen.getByText(OFFICIAL_PLATFORM_CONTACT.supportEmail)).toBeDefined();
            expect(screen.getByText(new RegExp(OFFICIAL_PLATFORM_CONTACT.responseTime, "i"))).toBeDefined();
        });

        it("AC-2.2: When users select the platform contact option, the system initiates the communication channel or navigates them to the appropriate contact view", () => {
            render(<ShopRegistrationSection />);

            // Phone link initiates tel:
            const phoneLink = screen.getByTestId("contact-channel-phone");
            expect(phoneLink.getAttribute("href")).toBe(OFFICIAL_PLATFORM_CONTACT.channels[0].href);
            expect(phoneLink.getAttribute("href")).toContain("tel:");

            // Email link initiates mailto:
            const emailLink = screen.getByTestId("contact-channel-email");
            expect(emailLink.getAttribute("href")).toBe(OFFICIAL_PLATFORM_CONTACT.channels[1].href);
            expect(emailLink.getAttribute("href")).toContain("mailto:");

            // WhatsApp link initiates external chat
            const whatsappLink = screen.getByTestId("contact-channel-whatsapp");
            expect(whatsappLink.getAttribute("href")).toBe(OFFICIAL_PLATFORM_CONTACT.channels[3].href);

            // Merchant desk navigates to the contact view
            const deskLink = screen.getByTestId("contact-channel-desk");
            expect(deskLink.getAttribute("href")).toBe("/contact#contact-form");
        });
    });

    describe("Story 3: Platform Registration and Shop Management Flow Showcase", () => {
        it("AC-3.1: The showcase page features a prominent visual media player demonstrating the platform registration process and shop management flow", () => {
            render(<TutorialMediaPlayer />);

            // Media player container exists
            const player = screen.getByTestId("tutorial-media-player");
            expect(player).toBeDefined();

            // Timeline scrubber is prominent
            const scrubber = screen.getByTestId("timeline-scrubber");
            expect(scrubber).toBeDefined();

            // Default initial chapter is Registration
            expect(screen.getAllByText(TUTORIAL_CHAPTERS[0].title).length).toBeGreaterThan(0);
        });

        it("AC-3.2: The displayed video or interactive showcase clearly highlights how users register to the platform and manage their shops and offers", () => {
            render(<TutorialMediaPlayer />);

            // Check that chapters highlight registration, shop setup, offers, posters, and go live
            expect(screen.getByTestId("chapter-tab-0")).toBeDefined();
            expect(screen.getByTestId("chapter-tab-1")).toBeDefined();
            expect(screen.getByTestId("chapter-tab-2")).toBeDefined();
            expect(screen.getByTestId("chapter-tab-3")).toBeDefined();
            expect(screen.getByTestId("chapter-tab-4")).toBeDefined();

            // Chapter 1 highlights registration
            expect(screen.getByTestId("chapter-tab-0").textContent).toContain("Registration");
            // Chapter 2 highlights shop setup
            expect(screen.getByTestId("chapter-tab-1").textContent).toContain("Shop Setup");
            // Chapter 3 highlights manage offers
            expect(screen.getByTestId("chapter-tab-2").textContent).toContain("Manage Offers");
        });

        it("AC-3.3: Users can control the media playback easily to review specific parts of the registration and management flows", () => {
            render(<TutorialMediaPlayer />);

            // 1. Play / Pause control
            const playPauseBtn = screen.getByTestId("player-play-pause-btn");
            expect(playPauseBtn).toBeDefined();
            fireEvent.click(playPauseBtn); // Starts playing
            expect(playPauseBtn.getAttribute("aria-label")).toBe("Pause");
            fireEvent.click(playPauseBtn); // Pauses
            expect(playPauseBtn.getAttribute("aria-label")).toBe("Play");

            // 2. Chapter jump control (Jump to Chapter 3: Manage Offers)
            const chapter3Tab = screen.getByTestId("chapter-tab-2");
            fireEvent.click(chapter3Tab);
            expect(screen.getAllByText(TUTORIAL_CHAPTERS[2].title).length).toBeGreaterThan(0);

            // 3. Next and Previous chapter controls
            const nextBtn = screen.getByTestId("player-next-chapter-btn");
            fireEvent.click(nextBtn);
            expect(screen.getAllByText(TUTORIAL_CHAPTERS[3].title).length).toBeGreaterThan(0);

            const prevBtn = screen.getByTestId("player-prev-chapter-btn");
            fireEvent.click(prevBtn);
            expect(screen.getAllByText(TUTORIAL_CHAPTERS[2].title).length).toBeGreaterThan(0);

            // 4. Playback speed selector
            const speedSelect = screen.getByTestId("playback-speed-select") as HTMLSelectElement;
            expect(speedSelect.value).toBe("1");
            fireEvent.change(speedSelect, { target: { value: "1.5" } });
            expect(speedSelect.value).toBe("1.5");

            // 5. Mute toggle
            const muteBtn = screen.getByTestId("player-mute-btn");
            expect(muteBtn.getAttribute("aria-label")).toBe("Mute narration");
            fireEvent.click(muteBtn);
            expect(muteBtn.getAttribute("aria-label")).toBe("Unmute narration");

            // 6. Reset / Replay
            const replayBtn = screen.getByTestId("player-replay-btn");
            fireEvent.click(replayBtn);
            expect(screen.getAllByText(TUTORIAL_CHAPTERS[0].title).length).toBeGreaterThan(0);

            // 7. Timeline scrubber click
            const scrubber = screen.getByTestId("timeline-scrubber");
            fireEvent.click(scrubber, { clientX: 200 });
        });
    });
});
