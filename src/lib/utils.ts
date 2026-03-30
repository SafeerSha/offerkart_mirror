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
