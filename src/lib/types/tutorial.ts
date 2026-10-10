export interface TutorialChapter {
    id: number;
    title: string;
    shortTitle: string;
    description: string;
    startSecond: number;
    durationSeconds: number;
    iconName: string;
    highlights: string[];
    image: string;
    mobileImage: string;
    badge: string;
    badgeVariant?: "orange" | "emerald" | "blue" | "purple";
    callToAction?: {
        label: string;
        href: string;
    };
}

export interface MediaPlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackSpeed: number;
    isMuted: boolean;
    isFullscreen: boolean;
    activeChapterIndex: number;
}

export interface PlatformContactChannel {
    id: string;
    title: string;
    subtitle: string;
    value: string;
    type: "phone" | "email" | "chat" | "location" | "form";
    href: string;
    actionLabel: string;
    badge?: string;
    badgeColor?: string;
    iconName: string;
}

export interface ContactSubmissionPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    businessName?: string;
    message: string;
}

export interface ContactSubmissionResponse {
    success: boolean;
    message: string;
    ticketId?: string;
}
