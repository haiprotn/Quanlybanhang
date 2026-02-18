
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Customer } from '../types';

// Hàm lấy API Key: Ưu tiên LocalStorage (người dùng nhập), sau đó đến biến môi trường
const getApiKey = () => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey && storedKey.trim() !== '') return storedKey;
    return process.env.API_KEY || "";
};

// Hàm khởi tạo client mới mỗi khi gọi để đảm bảo lấy Key mới nhất
const getAIClient = () => {
    const key = getApiKey();
    // Nếu không có key, trả về null để xử lý logic dummy
    if (!key || key === "dummy_key") return null;
    return new GoogleGenAI({ apiKey: key });
};

const MODEL_NAME = 'gemini-3-flash-preview';

const cleanJsonString = (text: string): string => {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(json)?|```$/g, '');
    }
    return cleanText.trim();
};

// Hàm kiểm tra kết nối API
export const validateConnection = async (key: string) => {
    try {
        const client = new GoogleGenAI({ apiKey: key });
        // Gọi thử model với prompt đơn giản
        await client.models.generateContent({
            model: MODEL_NAME,
            contents: "Hello",
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const generateDebtReport = async (customer: Customer, invoices: Invoice[]) => {
  const ai = getAIClient();
  if (!ai) {
      return "Chưa cấu hình API Key. Vui lòng vào Cài đặt -> Kết nối AI để nhập Key.";
  }
  
  try {
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const unpaidInvoices = customerInvoices.filter(inv => inv.status !== 'PAID');
    
    const prompt = `
      Bạn là trợ lý kế toán cho cửa hàng sữa.
      Khách: ${customer.name}. Tổng nợ: ${customer.totalDebt.toLocaleString()} VNĐ.
      Số hóa đơn chưa trả: ${unpaidInvoices.length}.
      Hãy nhận xét ngắn gọn về rủi ro và đề xuất cách thu nợ khéo léo.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
    });
    return response.text || "Không có phản hồi.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lỗi kết nối AI (Kiểm tra lại Key).";
  }
};

export const suggestRepairNote = async (symptoms: string) => {
  const ai = getAIClient();
  if (!ai) return "Vui lòng nhập API Key để nhận gợi ý.";

  try {
    const prompt = `
      Khách hàng tìm sữa/gặp vấn đề: "${symptoms}"
      Gợi ý 1 câu ngắn gọn cho nhân viên bán hàng tư vấn loại sữa phù hợp.
    `;
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
    });
    return response.text || "";
  } catch (error) {
      return "";
  }
}

export const analyzeBusinessHealth = async (invoices: Invoice[]) => {
  const ai = getAIClient();
  if (!ai) return "Chế độ Demo: Vui lòng nhập API Key trong Cài đặt để phân tích dữ liệu thực.";

  try {
     const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
     const prompt = `Phân tích ngắn gọn hiệu quả kinh doanh dựa trên doanh thu: ${totalRevenue}`;
     const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
     });
    return response.text || "";
  } catch (error) {
    return "Không thể phân tích dữ liệu.";
  }
}

// Schema
const invoiceSchema = {
    type: Type.OBJECT,
    description: "Invoice data",
    properties: {
        invoiceNumber: { type: Type.STRING },
        date: { type: Type.STRING },
        partnerName: { type: Type.STRING },
        taxCode: { type: Type.STRING },
        taxRate: { type: Type.NUMBER },
        type: { type: Type.STRING },
        internalCompany: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    productName: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    total: { type: Type.NUMBER }
                }
            }
        }
    },
    required: ["invoiceNumber", "partnerName", "items"]
};

const MY_COMPANIES_CONTEXT = `
MY COMPANIES:
1. "CÔNG TY SỮA TÂY NINH" (Matches: TNC).
2. "ĐẠI LÝ SỮA TÂY PHÁT" (Matches: TAY_PHAT).
`;

export const parseInvoiceFromText = async (text: string) => {
    const ai = getAIClient();
    if (!ai) {
        console.warn("Missing API Key");
        return null;
    }

    try {
        const prompt = `Extract VAT invoice data. ${MY_COMPANIES_CONTEXT} Text: "${text}"`;
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: invoiceSchema
            }
        });
        return JSON.parse(cleanJsonString(response.text || "{}"));
    } catch (error) {
        console.error("Parse Text Error:", error);
        throw error; // Throw error to handle in UI
    }
}

export const parseInvoiceFromImage = async (base64Data: string, mimeType: string) => {
    const ai = getAIClient();
    if (!ai) {
        console.warn("Missing API Key");
        return null;
    }

    try {
        const prompt = `Extract invoice data. ${MY_COMPANIES_CONTEXT}`;
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: invoiceSchema
            }
        });
        return JSON.parse(cleanJsonString(response.text || "{}"));
    } catch (error) {
        console.error("Image Parse Error:", error);
        throw error; // Throw error to handle in UI
    }
}
