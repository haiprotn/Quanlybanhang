
import { Invoice, Customer, SystemSettings } from '../types';

export const generateReceiptHTML = (invoice: Invoice, customer: Customer | undefined, settings: SystemSettings) => {
  const date = new Date(invoice.date).toLocaleString('vi-VN');
  
  // Logic: Nếu hơn 8 sản phẩm thì in khổ A4, ngược lại in khổ A5
  const isLargeOrder = invoice.items.length > 8;
  const pageSize = isLargeOrder ? 'A4' : 'A5';

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Hóa đơn bán hàng - ${invoice.id}</title>
      <style>
        @page { size: ${pageSize}; margin: 0; }
        body { 
            font-family: 'Arial', sans-serif; 
            font-size: 13px; 
            line-height: 1.4; 
            color: #000; 
            padding: 10mm 15mm;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
        }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .invoice-title { font-size: 20px; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; }
        .invoice-meta { font-size: 12px; margin-bottom: 20px; }
        
        .info { margin-bottom: 20px; font-size: 13px; border: 1px solid #eee; padding: 10px; border-radius: 4px; }
        
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        .table th { border-bottom: 2px solid #000; text-align: left; padding: 8px 5px; font-weight: bold; }
        .table td { padding: 8px 5px; border-bottom: 1px dotted #ccc; vertical-align: top; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .total-section { border-top: 2px solid #000; padding-top: 10px; margin-left: auto; width: 60%; font-size: 14px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total-final { font-weight: bold; font-size: 16px; margin-top: 5px; }
        
        .footer { margin-top: 40px; text-align: center; font-style: italic; font-size: 11px; color: #555; white-space: pre-line; }
        
        /* Utility for A5 vs A4 scaling if needed */
        ${pageSize === 'A5' ? `
            body { font-size: 12px; }
            .header { margin-bottom: 15px; }
            .company-name { font-size: 16px; }
        ` : ''}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${settings.companyName}</div>
        <div>ĐC: ${settings.companyAddress}</div>
        <div>Hotline: ${settings.companyPhone}</div>
      </div>
      
      <div class="text-center">
        <div class="invoice-title">HÓA ĐƠN BÁN LẺ</div>
        <div class="invoice-meta">Số: ${invoice.id} | Ngày: ${date}</div>
      </div>

      <div class="info">
        <div><strong>Khách hàng:</strong> ${customer ? customer.name : 'Khách lẻ'}</div>
        <div><strong>SĐT:</strong> ${customer ? customer.phone : '---'}</div>
        <div><strong>Địa chỉ:</strong> ${customer ? customer.address : '---'}</div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="width: 5%" class="text-center">#</th>
            <th style="width: 45%">Tên hàng hóa / Dịch vụ</th>
            <th style="width: 10%" class="text-center">SL</th>
            <th style="width: 20%" class="text-right">Đơn giá</th>
            <th style="width: 20%" class="text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.productName}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">${item.price.toLocaleString()}</td>
              <td class="text-right">${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
            <span>Tổng tiền hàng:</span>
            <span>${invoice.totalAmount.toLocaleString()} đ</span>
        </div>
        <div class="total-row">
            <span>Đã thanh toán:</span>
            <span>${invoice.paidAmount.toLocaleString()} đ</span>
        </div>
        <div class="total-row total-final">
            <span>CÒN LẠI:</span>
            <span>${(invoice.totalAmount - invoice.paidAmount).toLocaleString()} đ</span>
        </div>
      </div>

      <div class="footer">
        ${settings.invoiceFooterNote}
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
};
