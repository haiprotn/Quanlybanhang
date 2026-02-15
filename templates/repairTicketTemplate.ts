
import { Invoice, Customer, SystemSettings } from '../types';

export const generateRepairTicketHTML = (invoice: Invoice, customer: Customer | undefined, symptoms: string, technicalNote: string, settings: SystemSettings) => {
  const date = new Date(invoice.date).toLocaleString('vi-VN');
  const deviceInfo = invoice.deviceInfo || { deviceName: '---', password: '', accessories: '' };
  
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Phiếu tiếp nhận dịch vụ - ${invoice.id}</title>
      <style>
        @page { size: A5; margin: 0; }
        body { 
            font-family: 'Arial', sans-serif; 
            font-size: 12px; 
            line-height: 1.3; 
            color: #000; 
            padding: 10mm 15mm; 
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
        }
        .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .company-info h1 { font-size: 16px; margin: 0; text-transform: uppercase; font-weight: 800; }
        .company-info div { font-size: 11px; margin-top: 2px;}
        .ticket-info { text-align: right; font-size: 11px; white-space: nowrap; }
        .title { text-align: center; font-size: 20px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; }
        .section { margin-bottom: 15px; border: 1px solid #999; padding: 10px; border-radius: 4px; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; }
        .row { display: flex; margin-bottom: 6px; align-items: baseline; }
        .label { font-weight: bold; width: 130px; flex-shrink: 0; }
        .value { flex: 1; border-bottom: 1px dotted #333; padding-left: 5px; min-height: 16px; font-weight: 500; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 25px; text-align: center; page-break-inside: avoid; }
        .signature-box { width: 45%; }
        .signature-box strong { display: block; margin-bottom: 40px; font-size: 11px; text-transform: uppercase; }
        .note { font-size: 10px; font-style: italic; margin-top: 15px; text-align: center; border-top: 1px solid #eee; padding-top: 5px; white-space: pre-line; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${settings.companyName}</h1>
          <div>ĐC: ${settings.companyAddress}</div>
          <div>Hotline: ${settings.companyPhone}</div>
        </div>
        <div class="ticket-info">
          <div><strong>Số phiếu:</strong> ${invoice.id}</div>
          <div>${date}</div>
        </div>
      </div>

      <div class="title">BIÊN NHẬN SỬA CHỮA</div>

      <div class="section">
        <div class="section-title">1. Thông tin khách hàng</div>
        <div class="row">
          <div class="label">Họ tên:</div>
          <div class="value">${customer ? customer.name : 'Khách lẻ'}</div>
        </div>
        <div class="row">
          <div class="label">Điện thoại:</div>
          <div class="value">${customer ? customer.phone : ''}</div>
        </div>
        <div class="row">
          <div class="label">Địa chỉ:</div>
          <div class="value">${customer ? customer.address : ''}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. Thông tin thiết bị & Tình trạng</div>
        <div class="row">
          <div class="label">Tên thiết bị:</div>
          <div class="value">${deviceInfo.deviceName}</div>
        </div>
        ${deviceInfo.password ? `
        <div class="row">
          <div class="label">Mật khẩu:</div>
          <div class="value">${deviceInfo.password}</div>
        </div>` : ''}
        <div class="row">
          <div class="label">Phụ kiện:</div>
          <div class="value">${deviceInfo.accessories || 'Không có'}</div>
        </div>
        <div class="row">
          <div class="label">Mô tả lỗi (Khách):</div>
          <div class="value">${symptoms}</div>
        </div>
        <div class="row">
          <div class="label">Ghi chú (KTV):</div>
          <div class="value">${technicalNote}</div>
        </div>
      </div>

      <div class="note">
        ${settings.repairTicketFooterNote}
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <strong>Khách hàng ký gửi</strong>
          <br/>
          <span>${customer ? customer.name : ''}</span>
        </div>
        <div class="signature-box">
          <strong>Nhân viên tiếp nhận</strong>
          <br/>
          <span>(Ký, ghi rõ họ tên)</span>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
};
