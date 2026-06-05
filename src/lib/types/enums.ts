/**
 * Application-wide Enum declarations to avoid hardcoded values.
 * Using modern 'as const' objects to ensure seamless compatibility with existing string literals.
 */

export const OfferStatus = {
    ACTIVE: "active",
    PAUSED: "paused",
    EXPIRED: "expired",
    DRAFT: "draft",
    INACTIVE: "inactive",
} as const;
export type OfferStatus = typeof OfferStatus[keyof typeof OfferStatus];

export const PosterType = {
    JUST_POST: "just_post",
    MARKED_POSTER: "marked_poster",
    UNCLASSIFIED: "unclassified",
} as const;
export type PosterType = typeof PosterType[keyof typeof PosterType];

export const UserRole = {
    MERCHANT: "merchant",
    USER: "user",
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];
