
import * as pdfjsLib from 'pdfjs-dist';

// Config worker manually to ensure it loads from a valid CDN
const WORKER_URI = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        // Resolve the library object (handle ESM default export quirks)
        const pdfjs = (pdfjsLib as any).default || pdfjsLib;
        
        // Set worker if not already set
        if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URI;
        }

        const arrayBuffer = await file.arrayBuffer();
        
        // Load document
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
                
            fullText += `--- Page ${i} ---\n${pageText}\n`;
        }
        
        if (!fullText.trim()) {
            throw new Error("File PDF không chứa lớp văn bản (có thể là file scan/ảnh). Vui lòng dùng tính năng upload ảnh để AI đọc OCR.");
        }

        return fullText;
    } catch (error: any) {
        console.error("PDF Read Error:", error);
        throw new Error(error.message || "Lỗi không xác định khi đọc PDF");
    }
}
