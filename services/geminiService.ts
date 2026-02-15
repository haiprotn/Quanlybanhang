
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Customer, Product } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for quick, efficient text analysis
const MODEL_NAME = 'gemini-3-flash-preview';

export const generateDebtReport = async (customer: Customer, invoices: Invoice[]) => {
  try {
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const unpaidInvoices = customerInvoices.filter(inv => inv.status !== 'PAID');
    
    const prompt = `
      Bạn là một trợ lý kế toán chuyên nghiệp cho công ty dịch vụ sửa chữa.
      Hãy phân tích tình hình công nợ của khách hàng sau và đưa ra một đoạn nhận xét ngắn gọn (dưới 100 từ) về rủi ro và đề xuất hành động.
      
      Khách hàng: ${customer.name}
      Tổng nợ hiện tại: ${customer.totalDebt.toLocaleString()} VNĐ
      Số lượng hóa đơn chưa thanh toán: ${unpaidInvoices.length}
      Chi tiết các hóa đơn chưa trả hết:
      ${unpaidInvoices.map(inv => `- Mã ${inv.id}: Còn nợ ${(inv.totalAmount - inv.paidAmount).toLocaleString()} VNĐ`).join('\n')}
      
      Trả lời bằng Tiếng Việt, giọng văn chuyên nghiệp, lịch sự.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể phân tích dữ liệu lúc này.";
  }
};

export const suggestRepairNote = async (symptoms: string) => {
  try {
    const prompt = `
      Bạn là kỹ thuật viên trưởng của trung tâm sửa chữa máy tính/điện tử.
      Dựa trên mô tả lỗi của khách hàng: "${symptoms}"
      Hãy gợi ý một ghi chú kỹ thuật ngắn gọn để in vào phiếu tiếp nhận dịch vụ.
      Ghi chú nên bao gồm: Dự đoán lỗi, Hướng kiểm tra.
      Định dạng trả về: Văn bản thuần túy, không markdown cầu kỳ, ngắn gọn.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
    });
    return response.text;
  } catch (error) {
      console.error("Gemini Error:", error);
      return "Lỗi khi tạo gợi ý.";
  }
}

export const analyzeBusinessHealth = async (invoices: Invoice[]) => {
  try {
     const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
     const totalDebt = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
     const paidRatio = totalRevenue > 0 ? ((totalRevenue - totalDebt) / totalRevenue * 100).toFixed(1) : "0";

     const prompt = `
        Dựa trên số liệu kinh doanh:
        - Tổng doanh thu: ${totalRevenue.toLocaleString()} VNĐ
        - Tổng công nợ chưa thu: ${totalDebt.toLocaleString()} VNĐ
        - Tỷ lệ thu hồi nợ: ${paidRatio}%
        
        Hãy đưa ra 3 lời khuyên chiến lược ngắn gọn để cải thiện dòng tiền cho công ty sửa chữa & thương mại.
     `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Không thể phân tích dữ liệu kinh doanh.";
  }
}

// Configuration for Invoice Parsing Schema
const invoiceSchema = {
    type: Type.OBJECT,
    properties: {
        invoiceNumber: { type: Type.STRING },
        date: { type: Type.STRING },
        partnerName: { type: Type.STRING },
        taxCode: { type: Type.STRING },
        taxRate: { type: Type.NUMBER },
        type: { 
            type: Type.STRING, 
            description: "Invoice type: 'IN' (Input/Purchase) or 'OUT' (Output/Sale). Derived from buyer/seller context." 
        },
        internalCompany: {
            type: Type.STRING,
            description: "Values: 'TNC' or 'TAY_PHAT'. Indicates which of my companies is the participant in the invoice."
        },
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
    }
};

const MY_COMPANIES_CONTEXT = `
MY COMPANIES (The "Home" entities):
1. "CÔNG TY CỔ PHẦN MÁY TÍNH - THIẾT BỊ TRƯỜNG HỌC TÂY NINH" (Matches: TNC, Máy Tính Tây Ninh, Trường Học Tây Ninh, Công Ty Cổ Phần Máy Tính - Thiết Bị Trường Học Tây Ninh). Internal Code: TNC.
2. "CÔNG TY TNHH THIẾT BỊ GIẢI PHÁP TÂY PHÁT" (Matches: Tây Phát, Giải Pháp Tây Phát, Công Ty TNHH Thiết Bị Giải Pháp Tây Phát). Internal Code: TAY_PHAT.
`;

// AI Parser for VAT Invoice from Text (PDF extracted text)
export const parseInvoiceFromText = async (text: string) => {
    try {
        const prompt = `
            You are an expert VAT invoice parser. Extract invoice information from the provided text.
            ${MY_COMPANIES_CONTEXT}
            
            Tasks:
            1. Identify the SELLER and the BUYER.
            2. Determine 'type':
               - 'OUT' (Output/Sale): If the SELLER matches one of MY COMPANIES (TNC or TAY_PHAT).
               - 'IN' (Input/Purchase): If the BUYER matches one of MY COMPANIES (TNC or TAY_PHAT).
            3. Determine 'internalCompany':
               - If the participating My Company is related to "CÔNG TY CỔ PHẦN MÁY TÍNH - THIẾT BỊ TRƯỜNG HỌC TÂY NINH", set 'TNC'.
               - If the participating My Company is related to "CÔNG TY TNHH THIẾT BỊ GIẢI PHÁP TÂY PHÁT", set 'TAY_PHAT'.
               - If 'type' is OUT, check the Seller. If 'type' is IN, check the Buyer.
            4. Extract 'partnerName': The name of the other entity (the one that is NOT My Company).
            5. Extract 'taxCode': The tax code of the PARTNER.
            6. Extract 'invoiceNumber', 'date' (YYYY-MM-DD), 'taxRate' (e.g. 8, 10).
            7. Extract line items.

            Text to parse: "${text}"
            
            Return JSON matching the schema.
        `;
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: invoiceSchema
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini Parse Error", error);
        return null;
    }
}

// AI Parser for VAT Invoice from Image Base64 (OCR)
export const parseInvoiceFromImage = async (base64Data: string, mimeType: string) => {
    try {
        const prompt = `
            Analyze this invoice image. 
            ${MY_COMPANIES_CONTEXT}
            
            Tasks:
            1. Identify SELLER and BUYER.
            2. Determine 'type' (IN/OUT) based on whether My Company is Buyer (IN) or Seller (OUT).
            3. Determine 'internalCompany' (TNC or TAY_PHAT) based on the name of My Company found in the invoice.
            4. Extract invoiceNumber, date, partnerName (the other party), taxCode (of partner), items, taxRate.
            
            Return in JSON format.
        `;
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME, 
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: invoiceSchema
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini Image Parse Error", error);
        return null;
    }
}
