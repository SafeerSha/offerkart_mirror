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

export function getSocialEmbedInfo(platform: string, url: string): { embedUrl: string | null; aspectClass: string } {
    const lowerPlatform = platform.toLowerCase();
    
    // Parse YouTube
    if (lowerPlatform === 'youtube') {
        let videoId: string | null = null;
        if (url.includes('/shorts/')) {
            videoId = url.split('/shorts/')[1]?.split(/[?#]/)[0] || null;
            if (videoId) {
                return { embedUrl: `https://www.youtube.com/embed/${videoId}`, aspectClass: "aspect-[9/16] max-h-[60vh] h-[480px] w-auto mx-auto" };
            }
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split(/[&#]/)[0] || null;
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || null;
        } else if (url.includes('/embed/')) {
            videoId = url.split('/embed/')[1]?.split(/[?#]/)[0] || null;
        }
        if (videoId) {
            return { embedUrl: `https://www.youtube.com/embed/${videoId}`, aspectClass: "aspect-video w-full" };
        }
    }
    
    // Parse Instagram
    if (lowerPlatform === 'instagram') {
        let postId: string | null = null;
        if (url.includes('/p/')) {
            postId = url.split('/p/')[1]?.split('/')[0] || null;
        } else if (url.includes('/reel/')) {
            postId = url.split('/reel/')[1]?.split('/')[0] || null;
        } else if (url.includes('/reels/')) {
            postId = url.split('/reels/')[1]?.split('/')[0] || null;
        }
        if (postId) {
            return { embedUrl: `https://www.instagram.com/p/${postId}/embed/`, aspectClass: "aspect-[3/4] w-full max-h-[60vh] h-[480px]" };
        }
    }

    // Parse Facebook
    if (lowerPlatform === 'facebook') {
        return { embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`, aspectClass: "aspect-video w-full" };
    }
    
    return { embedUrl: null, aspectClass: "" };
}
