export type SocialPlatform = "YOUTUBE" | "INSTAGRAM" | "FACEBOOK" | string;

export interface SocialLinkItem {
    url: string;
    platform: SocialPlatform;
}

export interface OfferSocialLink {
    id: number;
    title: string;
    validTo: string;
    socialLinks: SocialLinkItem[];
    shop_name: string;
    logo_url: string | null;
    distance: number | null;
    defaultPoster: string | null;
}

export interface SocialLinksPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SocialLinksData {
    data: OfferSocialLink[];
    sort?: string;
    pagination: SocialLinksPagination;
}

export interface SocialLinksResponse {
    success: boolean;
    message?: string;
    data: SocialLinksData;
    error?: string;
}

export interface SocialLinksQuery {
    page?: number;
    limit?: number;
    sort?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    industryId?: number | string | null;
    radius?: number | string | null;
}

export interface PaginatedSocialLinksResult {
    success: boolean;
    data: OfferSocialLink[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    sort?: string;
    error?: string;
}
