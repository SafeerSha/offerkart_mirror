// pdfjs is dynamically imported to avoid SSR crashes ("DOMMatrix is not defined")
export interface PDFProcessingResult {
    success: boolean;
    images: { file: File; previewUrl: string }[];
    error?: string;
}

const createdObjectUrls: string[] = [];

export function cleanupPDFObjectUrls(): void {
    createdObjectUrls.forEach(url => URL.revokeObjectURL(url));
    createdObjectUrls.length = 0;
}

export async function processPDFFile(
    pdfFile: File,
    maxSizeMB: number = 5,
    scale: number = 2
): Promise<PDFProcessingResult> {
    try {
        if (pdfFile.size > maxSizeMB * 1024 * 1024) {
            return {
                success: false,
                images: [],
                error: `PDF file exceeds ${maxSizeMB}MB limit`,
            };
        }

        const { pdfjs } = await import('react-pdf');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();

        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const images: { file: File; previewUrl: string }[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport, canvas }).promise;

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (b) => { if (b) resolve(b); else reject(new Error('Failed to create blob')); },
                    'image/png',
                    1.0
                );
            });

            const imageFile = new File(
                [blob],
                `${pdfFile.name.replace(/\.pdf$/i, '')}_page_${pageNum}.png`,
                { type: 'image/png' }
            );

            const objectUrl = URL.createObjectURL(blob);
            createdObjectUrls.push(objectUrl);
            images.push({ file: imageFile, previewUrl: objectUrl });

            canvas.width = 0;
            canvas.height = 0;
        }

        return { success: true, images };
    } catch (error) {
        console.error('PDF processing error:', error);
        return {
            success: false,
            images: [],
            error: error instanceof Error ? error.message : 'Failed to process PDF',
        };
    }
}

export function isPDFFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}
