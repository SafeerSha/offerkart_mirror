import { TutorialChapter, PlatformContactChannel } from "@/lib/types/tutorial";

export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
    {
        id: 1,
        title: "Quick Registration & Verification",
        shortTitle: "Registration",
        description: "Get your digital storefront up and running in minutes. Simply fill in your business details, complete OTP verification, and establish your verified merchant badge instantly on OfferKart.",
        startSecond: 0,
        durationSeconds: 35,
        iconName: "Zap",
        highlights: [
            "Fast 3-min self-serve onboarding",
            "Instant OTP phone verification",
            "Official verified merchant badge"
        ],
        image: "/tut-1.png",
        mobileImage: "/tut-1-mobile.png",
        badge: "STAGE 01 · ONBOARDING",
        badgeVariant: "orange",
        callToAction: {
            label: "Start Registration",
            href: "/shop-registration"
        }
    },
    {
        id: 2,
        title: "Shop Profile & Storefront Setup",
        shortTitle: "Shop Setup",
        description: "Configure your store branding, add multiple physical branch locations, set operating hours, and pin your exact GPS location for local customer discovery.",
        startSecond: 35,
        durationSeconds: 35,
        iconName: "Store",
        highlights: [
            "Multi-branch location management",
            "Interactive GPS pin & radius control",
            "Custom store logo & banner showcase"
        ],
        image: "/tut-3.png",
        mobileImage: "/tut-3-mobile.png",
        badge: "STAGE 02 · STOREFRONT",
        badgeVariant: "emerald",
        callToAction: {
            label: "Manage Storefront",
            href: "/shop-manager"
        }
    },
    {
        id: 3,
        title: "Create & Manage Irresistible Offers",
        shortTitle: "Manage Offers",
        description: "Use our merchant dashboard to launch exclusive percentage discounts, flat deals, and flash sales designed specifically to drive high-intent, immediate foot traffic to your physical store.",
        startSecond: 70,
        durationSeconds: 35,
        iconName: "Target",
        highlights: [
            "Custom discount schedules & flash deals",
            "Radius-based hyper-local targeting",
            "Real-time offer toggle (Active/Pause)"
        ],
        image: "/tut-2.png",
        mobileImage: "/tut-2-mobile.png",
        badge: "STAGE 03 · OFFERS",
        badgeVariant: "blue",
        callToAction: {
            label: "Create First Offer",
            href: "/shop-manager/create-offer"
        }
    },
    {
        id: 4,
        title: "Marketing Posters & Visual Banners",
        shortTitle: "Marketing Posters",
        description: "Enhance your store's visual appeal using our built-in designer. Pick curated promotional templates and publish high-definition banners across the public app feed.",
        startSecond: 105,
        durationSeconds: 35,
        iconName: "LayoutDashboard",
        highlights: [
            "Curated festival & discount templates",
            "Canva-style visual poster studio",
            "Instant one-click feed publishing"
        ],
        image: "/tut-3.png",
        mobileImage: "/tut-3-mobile.png",
        badge: "STAGE 04 · CREATIVE",
        badgeVariant: "purple",
        callToAction: {
            label: "Design Poster",
            href: "/shop-manager/poster-designer"
        }
    },
    {
        id: 5,
        title: "Go Live & Track Real-Time Footfall",
        shortTitle: "Go Live",
        description: "Publish your shop and watch your deals instantly appear on the public OfferKart consumer app. Monitor real-time shopper discovery and foot-traffic analytics.",
        startSecond: 140,
        durationSeconds: 40,
        iconName: "Rocket",
        highlights: [
            "Instant public discovery sync",
            "Nearby shopper push notifications",
            "Live foot-traffic & conversion analytics"
        ],
        image: "/tut-4.png",
        mobileImage: "/tut-4-mobile.png",
        badge: "STAGE 05 · GROWTH",
        badgeVariant: "orange",
        callToAction: {
            label: "View Public Discovery",
            href: "/offers"
        }
    }
];

export const TOTAL_TUTORIAL_DURATION = 180; // 3 minutes total

export const OFFICIAL_PLATFORM_CONTACT: {
    channels: PlatformContactChannel[];
    supportEmail: string;
    supportPhone: string;
    formattedPhone: string;
    headquarters: string;
    hours: string;
    responseTime: string;
} = {
    supportEmail: "support@offerkart.com",
    supportPhone: "+15551234567",
    formattedPhone: "+1 (555) 123-4567",
    headquarters: "123 Market St, San Francisco, CA",
    hours: "Mon - Sat: 9:00 AM - 8:00 PM EST",
    responseTime: "Average response < 15 mins",
    channels: [
        {
            id: "phone",
            title: "Merchant Sales Hotline",
            subtitle: "Speak directly with onboarding specialists",
            value: "+1 (555) 123-4567",
            type: "phone",
            href: "tel:+15551234567",
            actionLabel: "Call Hotline",
            badge: "Instant Call",
            badgeColor: "emerald",
            iconName: "Phone"
        },
        {
            id: "email",
            title: "Official Support Email",
            subtitle: "24/7 dedicated merchant inquiry desk",
            value: "support@offerkart.com",
            type: "email",
            href: "mailto:support@offerkart.com?subject=Merchant%20Inquiry%20-%20OfferKart",
            actionLabel: "Email Desk",
            badge: "< 15 min reply",
            badgeColor: "blue",
            iconName: "Mail"
        },
        {
            id: "form",
            title: "Merchant Support Desk",
            subtitle: "Submit a callback or custom setup request",
            value: "Online Support Ticket",
            type: "form",
            href: "/contact#contact-form",
            actionLabel: "Open Contact Desk",
            badge: "Priority Queue",
            badgeColor: "orange",
            iconName: "Send"
        },
        {
            id: "whatsapp",
            title: "WhatsApp Merchant Desk",
            subtitle: "Quick onboarding chat on WhatsApp",
            value: "+1 (555) 123-4567",
            type: "chat",
            href: "https://wa.me/15551234567?text=Hi%20OfferKart%20Team%2C%20I%20want%20to%20register%20my%20shop",
            actionLabel: "Chat on WhatsApp",
            badge: "Fast Chat",
            badgeColor: "emerald",
            iconName: "MessageSquare"
        }
    ]
};
