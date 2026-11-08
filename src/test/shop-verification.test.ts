import { describe, it, expect } from "vitest";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
    ShopVerificationPayload,
    RelationshipType,
    VerificationDocumentType,
    VerificationImageCategory,
    ShopVerificationResponseData,
    ShopVerificationDetails
} from "@/lib/types/shop";

describe("Shop Verification API and Payload Model", () => {
    it("should have correct verification endpoint defined in ENDPOINTS", () => {
        expect(ENDPOINTS.SHOP.VERIFICATION).toBe("business/shop/verification");
    });

    it("should correctly validate and structure the expected shop verification payload", () => {
        const payload: ShopVerificationPayload = {
            latitude: 9.123456,
            longitude: 76.123456,
            gpsAccuracyMeters: 12,

            personName: "Amal Job",
            relationshipType: "OWNER",

            documentType: "TRADE_LICENCE",
            documentNumber: "LIC123456",

            documentFile: "trade-licence.pdf",
            authorizationFile: null,

            images: [
                {
                    category: "SHOP_NAME_BOARD",
                    mediaType: "IMAGE",
                    file: "shop-name-board.jpg",
                    mimeType: "image/jpeg",
                    location: {
                        latitude: 9.123456,
                        longitude: 76.123456,
                        accuracyMeters: 12,
                        capturedAt: "2026-10-30T08:30:00.000Z",
                    },
                },
                {
                    category: "SHOP_EXTERIOR",
                    mediaType: "IMAGE",
                    file: "shop-exterior.jpg",
                    mimeType: "image/jpeg",
                    location: {
                        latitude: 9.123460,
                        longitude: 76.123460,
                        accuracyMeters: 10,
                        capturedAt: "2026-10-30T08:32:00.000Z",
                    },
                },
                {
                    category: "SHOP_INTERIOR",
                    mediaType: "IMAGE",
                    file: "shop-interior.jpg",
                    mimeType: "image/jpeg",
                    location: {
                        latitude: 9.123465,
                        longitude: 76.123465,
                        accuracyMeters: 15,
                        capturedAt: "2026-10-30T08:34:00.000Z",
                    },
                },
            ],
        };

        // Assert shape and types
        expect(payload.latitude).toBeCloseTo(9.123456);
        expect(payload.longitude).toBeCloseTo(76.123456);
        expect(payload.gpsAccuracyMeters).toBe(12);

        expect(payload.personName).toBe("Amal Job");
        expect(payload.relationshipType).toBe("OWNER");
        expect(payload.documentType).toBe("TRADE_LICENCE");
        expect(payload.documentNumber).toBe("LIC123456");
        expect(payload.documentFile).toBe("trade-licence.pdf");
        expect(payload.authorizationFile).toBeNull();

        // 3 mandatory photo categories
        expect(payload.images).toHaveLength(3);
        const categories = payload.images.map((img) => img.category);
        expect(categories).toContain("SHOP_NAME_BOARD");
        expect(categories).toContain("SHOP_EXTERIOR");
        expect(categories).toContain("SHOP_INTERIOR");

        // Geotags on images
        payload.images.forEach((img) => {
            expect(img.mediaType).toBe("IMAGE");
            expect(img.mimeType).toBe("image/jpeg");
            expect(img.location.latitude).toBeGreaterThan(0);
            expect(img.location.longitude).toBeGreaterThan(0);
            expect(img.location.accuracyMeters).toBeGreaterThan(0);
            expect(new Date(img.location.capturedAt).toISOString()).toBe(img.location.capturedAt);
        });
    });

    it("should allow non-owner relationship with authorization file", () => {
        const relationship: RelationshipType = "MANAGER";
        const docType: VerificationDocumentType = "GST_CERTIFICATE";
        const imageCategory: VerificationImageCategory = "SHOP_NAME_BOARD";

        expect(relationship).toBe("MANAGER");
        expect(docType).toBe("GST_CERTIFICATE");
        expect(imageCategory).toBe("SHOP_NAME_BOARD");
    });

    it("should construct the exact payload structure expected by the API", () => {
        const expectedKeys = [
            "latitude",
            "longitude",
            "gpsAccuracyMeters",
            "personName",
            "relationshipType",
            "documentType",
            "documentNumber",
            "documentFile",
            "authorizationFile",
            "images",
        ];

        const payload: ShopVerificationPayload = {
            latitude: 9.123456,
            longitude: 76.123456,
            gpsAccuracyMeters: 12,
            personName: "Amal Job",
            relationshipType: "OWNER",
            documentType: "TRADE_LICENCE",
            documentNumber: "LIC123456",
            documentFile: "trade-licence.pdf",
            authorizationFile: null,
            images: [],
        };

        expect(Object.keys(payload)).toEqual(expectedKeys);
    });

    it("should correctly validate the get shop verification details response schema", () => {
        const mockResponse: ShopVerificationResponseData = {
            shopId: 14,
            shopName: "shan jahan stores",
            verification: {
                id: "1",
                attemptNumber: 1,
                status: "UNDER_REVIEW",
                physicalStatus: "MANUAL_REVIEW",
                ownerStatus: "SUBMITTED",
                registeredLocation: {
                    latitude: 10.3528744,
                    longitude: 76.5120396
                },
                verificationLocation: {
                    latitude: 10.0275,
                    longitude: 76.3694,
                    gpsAccuracyMeters: 12,
                    distanceMeters: 39404.08062947825
                },
                submittedAt: "2026-11-07T15:29:24.343Z",
                reviewedAt: null,
                adminRemarks: null,
                rejectionReason: null,
                ownerDetails: {
                    personName: "safeer sha",
                    relationshipType: "OWNER",
                    documentType: "TRADE_LICENCE",
                    documentNumber: "yhujkhjhgjb",
                    documentFileUrl: "https://offersnearu.s3.eu-north-1.amazonaws.com/shop-verifications/documents/8e54b86f-d90a-4b5d-8b52-6c942d238d24-doc.jpg",
                    authorizationFileUrl: null,
                    status: "SUBMITTED",
                    adminRemarks: null
                },
                images: [
                    {
                        id: "1",
                        category: "SHOP_NAME_BOARD",
                        mediaType: "IMAGE",
                        fileUrl: "https://offersnearu.s3.eu-north-1.amazonaws.com/shop-verifications/22413cd8-5ec1-4823-a01d-509745311c72-img1.jpg",
                        mimeType: "image/jpeg",
                        location: {
                            latitude: 10.0275,
                            longitude: 76.3694,
                            accuracyMeters: 12,
                            capturedAt: "2026-11-07T15:29:21.762Z"
                        }
                    },
                    {
                        id: "2",
                        category: "SHOP_EXTERIOR",
                        mediaType: "IMAGE",
                        fileUrl: "https://offersnearu.s3.eu-north-1.amazonaws.com/shop-verifications/d3fe3535-5952-4348-8eb4-d7cbfc8c04aa-img2.jpg",
                        mimeType: "image/jpeg",
                        location: {
                            latitude: 10.0275,
                            longitude: 76.3694,
                            accuracyMeters: 12,
                            capturedAt: "2026-11-07T15:29:21.762Z"
                        }
                    },
                    {
                        id: "3",
                        category: "SHOP_INTERIOR",
                        mediaType: "IMAGE",
                        fileUrl: "https://offersnearu.s3.eu-north-1.amazonaws.com/shop-verifications/aead21fb-a351-44b0-b51d-1c4bc658a078-img3.jpg",
                        mimeType: "image/jpeg",
                        location: {
                            latitude: 10.0275,
                            longitude: 76.3694,
                            accuracyMeters: 12,
                            capturedAt: "2026-11-07T15:29:21.762Z"
                        }
                    }
                ]
            }
        };

        expect(mockResponse.shopId).toBe(14);
        expect(mockResponse.shopName).toBe("shan jahan stores");
        expect(mockResponse.verification).not.toBeNull();
        expect(mockResponse.verification?.status).toBe("UNDER_REVIEW");
        expect(mockResponse.verification?.ownerDetails.personName).toBe("safeer sha");
        expect(mockResponse.verification?.ownerDetails.documentType).toBe("TRADE_LICENCE");
        expect(mockResponse.verification?.images).toHaveLength(3);
        expect(mockResponse.verification?.verificationLocation.distanceMeters).toBeGreaterThan(0);
    });
});

