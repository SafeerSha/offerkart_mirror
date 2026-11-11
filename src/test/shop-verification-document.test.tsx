import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
    DocumentUploadField,
    getSafeExternalDocumentUrl,
    getSafeImagePreviewUrl,
    isImageDocument,
    isAllowedDocumentFile,
} from "@/components/shop-manager/ShopVerificationTab";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("ShopVerification Document Preview & Security", () => {
    it("renders clickable View & thumbnail for submitted S3 image in read-only mode without overlaying file input", () => {
        const s3Url =
            "https://offersnearu.s3.eu-north-1.amazonaws.com/shop-verifications/documents/8e54b86f-d90a-4b5d-8b52-6c942d238d24-doc.jpg";
        const onPreviewImage = vi.fn();

        const { container } = render(
            <DocumentUploadField
                inputId="doc-file-input"
                label="Business Licence Document"
                file={null}
                fileName={s3Url}
                previewUrl={s3Url}
                isReadOnly={true}
                attachedLabel="Document attached"
                submittedLabel="Submitted Document"
                emptyTitle="Click to browse"
                emptySubtitle="PDF, JPG, PNG up to 5MB"
                previewAlt="Business Licence Document"
                onFileChange={vi.fn()}
                onRemove={vi.fn()}
                onPreviewImage={onPreviewImage}
            />
        );

        // No overlapping <input type="file"> should sit over the attached card
        expect(container.querySelector('input[type="file"]')).toBeNull();
        expect(screen.getByText("Submitted Document")).toBeTruthy();

        // Clicking View triggers in-app image modal preview
        const viewBtn = screen.getByRole("button", { name: /view/i });
        fireEvent.click(viewBtn);
        expect(onPreviewImage).toHaveBeenCalledWith(s3Url, "Business Licence Document");

        // External new-tab anchor also preserves safe target & rel attributes
        const extLink = screen.getByRole("link", { name: /open document in new tab/i });
        expect(extLink.getAttribute("href")).toBe(s3Url);
        expect(extLink.getAttribute("target")).toBe("_blank");
        expect(extLink.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("previews locally attached image before submission and supports removal", () => {
        const localDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/";
        const localFile = new File(["img"], "trade-licence.jpg", { type: "image/jpeg" });
        const onPreviewImage = vi.fn();
        const onRemove = vi.fn();

        render(
            <DocumentUploadField
                inputId="doc-file-input"
                label="Business Licence Document"
                file={localFile}
                fileName="trade-licence.jpg"
                previewUrl={localDataUrl}
                isReadOnly={false}
                attachedLabel="Document attached"
                submittedLabel="Submitted Document"
                emptyTitle="Click to browse"
                emptySubtitle="PDF, JPG, PNG up to 5MB"
                previewAlt="Business Licence Document"
                onFileChange={vi.fn()}
                onRemove={onRemove}
                onPreviewImage={onPreviewImage}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /view/i }));
        expect(onPreviewImage).toHaveBeenCalledWith(localDataUrl, "Business Licence Document");

        fireEvent.click(screen.getByRole("button", { name: /remove file/i }));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("opens local PDF in a new tab via temporary blob URL", () => {
        const pdfFile = new File(["%PDF-1.4"], "licence.pdf", { type: "application/pdf" });
        const createObjectUrlSpy = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:http://localhost/mock-pdf");
        const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

        render(
            <DocumentUploadField
                inputId="doc-file-input"
                label="Business Licence Document"
                file={pdfFile}
                fileName="licence.pdf"
                previewUrl="data:application/pdf;base64,JVBERi0xLjQ="
                isReadOnly={false}
                attachedLabel="Document attached"
                submittedLabel="Submitted Document"
                emptyTitle="Click to browse"
                emptySubtitle="PDF, JPG, PNG up to 5MB"
                previewAlt="Business Licence Document"
                onFileChange={vi.fn()}
                onRemove={vi.fn()}
                onPreviewImage={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /view/i }));
        expect(createObjectUrlSpy).toHaveBeenCalledWith(pdfFile);
        expect(openSpy).toHaveBeenCalledWith(
            "blob:http://localhost/mock-pdf",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("blocks unsafe URLs, SVG uploads, and non-image MIME types", () => {
        expect(getSafeExternalDocumentUrl("javascript:alert(1)")).toBeNull();
        expect(getSafeExternalDocumentUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
        expect(getSafeExternalDocumentUrl("https://offersnearu.s3.eu-north-1.amazonaws.com/doc.pdf")).toBe(
            "https://offersnearu.s3.eu-north-1.amazonaws.com/doc.pdf"
        );

        expect(getSafeImagePreviewUrl("data:image/svg+xml;base64,PHN2Zz4=", "doc.svg")).toBeNull();
        expect(getSafeImagePreviewUrl("javascript:alert(1)", "doc.png")).toBeNull();
        expect(getSafeImagePreviewUrl("data:image/png;base64,abc123", "doc.png")).toBe(
            "data:image/png;base64,abc123"
        );

        expect(
            isAllowedDocumentFile(new File(["<svg/>"], "fake.png", { type: "image/svg+xml" }))
        ).toBe(false);
        expect(
            isAllowedDocumentFile(new File(["<html>"], "bad.html", { type: "text/html" }))
        ).toBe(false);
        expect(
            isAllowedDocumentFile(new File(["%PDF"], "doc.pdf", { type: "application/pdf" }))
        ).toBe(true);
        expect(
            isAllowedDocumentFile(new File(["img"], "doc.webp", { type: "image/webp" }))
        ).toBe(true);

        expect(
            isImageDocument(
                null,
                null,
                "https://offersnearu.s3.eu-north-1.amazonaws.com/shop-verifications/documents/doc.jpg?X-Amz-Signature=123"
            )
        ).toBe(true);
        expect(isImageDocument(null, null, "https://example.com/licence.pdf")).toBe(false);
    });
});

