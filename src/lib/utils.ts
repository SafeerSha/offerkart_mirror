import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getRelativeTime(dateString: string | Date) {
    if (!dateString) return null;
    const now = new Date();
    const then = new Date(dateString);
    
    // Set both to start of day for accurate day difference
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thenDay = new Date(then.getFullYear(), then.getMonth(), then.getDate());
    
    const diffInMs = nowDay.getTime() - thenDay.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 0) return "Upcoming";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    
    return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateLocal(date: Date | undefined) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    try {
        const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([A-Za-z0-9_-]{11})/;
        const match = url.match(regExp);
        if (match && match[1]) {
            return match[1];
        }
    } catch (e) {}

    if (url.includes('/shorts/')) {
        return url.split('/shorts/')[1]?.split(/[?#&/]/)[0] || null;
    } else if (url.includes('v=')) {
        return url.split('v=')[1]?.split(/[?#&/]/)[0] || null;
    } else if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1]?.split(/[?#&/]/)[0] || null;
    } else if (url.includes('/embed/')) {
        return url.split('/embed/')[1]?.split(/[?#&/]/)[0] || null;
    }
    return null;
}

export function getSocialEmbedInfo(platform: string, url: string): {
    embedUrl: string | null;
    nativeEmbedUrl?: string | null;
    aspectClass: string;
    isVertical?: boolean;
    videoId?: string | null;
} {
    const lowerPlatform = platform.toLowerCase();
    
    // Parse YouTube
    if (lowerPlatform === 'youtube') {
        const videoId = getYouTubeVideoId(url);
        const isShorts = url.includes('/shorts/');
        if (videoId) {
            return {
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&playsinline=1&rel=0`,
                // Default native YouTube player with native controls & browser-safe autoplay
                nativeEmbedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`,
                aspectClass: isShorts ? "aspect-[9/16] max-h-[75vh] h-[580px] w-auto mx-auto" : "aspect-video w-full",
                isVertical: isShorts,
                videoId
            };
        }
    }
    
    // Parse Instagram
    if (lowerPlatform === 'instagram') {
        const match = url.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
        const postId = match ? match[1] : null;
        const isReel = url.includes('/reel');

        if (postId) {
            const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
            const nativeEmbedUrl = isReel 
                ? `https://www.instagram.com/reel/${postId}/embed/`
                : `https://www.instagram.com/p/${postId}/embed/`;

            return { 
                embedUrl,
                nativeEmbedUrl,
                aspectClass: isReel ? "aspect-[9/16] w-full" : "aspect-[3/4] w-full max-h-[60vh] h-[480px]",
                isVertical: isReel
            };
        }
    }

    // Parse Facebook
    if (lowerPlatform === 'facebook') {
        const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
        const nativeEmbedUrl = `${embedUrl}&autoplay=1&mute=1`;
        return { 
            embedUrl, 
            nativeEmbedUrl,
            aspectClass: "aspect-video w-full" 
        };
    }
    
    return { embedUrl: null, nativeEmbedUrl: null, aspectClass: "" };
}

export function getInstagramPostId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
    return match ? match[1] : null;
}

export function getSocialThumbnail(platform: string, url: string): string | null {
    if (!url) return null;
    const lowerPlatform = platform.toLowerCase();
    
    if (lowerPlatform === 'youtube') {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    }

    if (lowerPlatform === 'instagram') {
        const postId = getInstagramPostId(url);
        if (postId) {
            return `/api/social-thumbnail?platform=instagram&postId=${postId}`;
        }
    }
    
    return null;
}
