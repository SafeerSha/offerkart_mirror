export interface AddShopRequest {
    shop_name: string;
    latitude: string;
    longitude: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
    phone: string;
    file?: File | null;
    is_active: string;
    website?: string;
    website_url?: string;
}

export interface Shop {
    id: number;
    user_id: string;
    shop_name: string;
    logo_url: string | null;
    email: string | null;
    phone: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
    description: string | null;
    licence_no: string | null;
    is_active: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    industry?: string | number;
    website?: string | null;
    website_url?: string | null;
}

export interface Shops {
    id: number;
    shop_name: string;
    logo_url: string | null;
    website?: string | null;
    website_url?: string | null;
}

export type RelationshipType =
    | "OWNER"
    | "MANAGER"
    | "PARTNER"
    | "AUTHORIZED_REPRESENTATIVE"
    | "EMPLOYEE";

export type VerificationDocumentType =
    | "TRADE_LICENCE"
    | "GST_CERTIFICATE"
    | "FSSAI_REGISTRATION"
    | "SHOP_ESTABLISHMENT"
    | "MSME_CERTIFICATE"
    | "OTHER";

export type VerificationImageCategory =
    | "SHOP_NAME_BOARD"
    | "SHOP_EXTERIOR"
    | "SHOP_INTERIOR";

export interface VerificationLocation {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
}

export type VerificationStatus =
    | "PENDING"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "MANUAL_REVIEW";

export interface RegisteredLocation {
    latitude: number;
    longitude: number;
}

export interface VerificationLocationDetails {
    latitude: number;
    longitude: number;
    gpsAccuracyMeters: number;
    distanceMeters?: number;
}

export interface VerificationOwnerDetails {
    personName: string;
    relationshipType: RelationshipType | string;
    documentType: VerificationDocumentType | string;
    documentNumber: string;
    documentFileUrl: string;
    authorizationFileUrl: string | null;
    status: VerificationStatus | string;
    adminRemarks: string | null;
}

export interface VerificationImageDetail {
    id: string;
    category: VerificationImageCategory;
    mediaType: "IMAGE" | string;
    fileUrl: string;
    mimeType: string;
    location: VerificationLocation;
}

export interface ShopVerificationDetails {
    id: string;
    attemptNumber: number;
    status: VerificationStatus | string;
    physicalStatus: VerificationStatus | string;
    ownerStatus: VerificationStatus | string;
    registeredLocation: RegisteredLocation;
    verificationLocation: VerificationLocationDetails;
    submittedAt: string;
    reviewedAt: string | null;
    adminRemarks: string | null;
    rejectionReason: string | null;
    ownerDetails: VerificationOwnerDetails;
    images: VerificationImageDetail[];
}

export interface ShopVerificationResponseData {
    shopId: number;
    shopName: string;
    verification: ShopVerificationDetails | null;
}

export interface VerificationImageItem {
    category: VerificationImageCategory;
    mediaType: "IMAGE";
    file: string;
    mimeType: string;
    location: VerificationLocation;
}

export interface ShopVerificationPayload {
    shopId?: number | string;
    shop_id?: number | string;
    latitude: number;
    longitude: number;
    gpsAccuracyMeters: number;
    personName: string;
    relationshipType: RelationshipType | string;
    documentType: VerificationDocumentType | string;
    documentNumber: string;
    documentFile: string | File;
    authorizationFile: string | File | null;
    images: VerificationImageItem[];
}
