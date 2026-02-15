
import { Product, Invoice, Customer, SystemSettings, Warehouse } from '../types';

const getBaseStyles = () => `
    body { font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.4; color: #000; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .company-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .report-title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 15px 0; }
    .meta { font-style: italic; font-size: 12px; margin-bottom: 20px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #333; padding: 6px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .footer { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
    .footer div { width: 30%; }
    .footer strong { display: block; margin-bottom: 50px; }
    @page { size: A4; margin: 10mm; }
`;

const getCompanyHeader = (settings: SystemSettings) => `
    <div class="header">
        <div class="company-name">${settings.companyName}</div>
        <div>ĐC: ${settings.companyAddress}</div>
        <div>ĐT: ${settings.companyPhone}</div>
    </div>
`;

export const generateStockReportHTML = (products: any[], settings: SystemSettings) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><title>Báo cáo Tồn kho</title><style>${getBaseStyles()}</style></head>
    <body>
        ${getCompanyHeader(settings)}
        <div class="header">
            <div class="report-title">BÁO CÁO TỒN KHO HÀNG HÓA</div>
            <div class="meta">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%">STT</th>
                    <th style="width: 15%">Mã SP</th>
                    <th style="width: 35%">Tên Sản phẩm</th>
                    <th style="width: 10%">ĐVT</th>
                    <th style="width: 10%">Tồn T.Phát</th>
                    <th style="width: 10%">Tồn TNC</th>
                    <th style="width: 15%">Tổng trị giá vốn</th>
                </tr>
            </thead>
            <tbody>
                ${products.map((p, index) => {
                    const totalStock = p.stock[Warehouse.TAY_PHAT] + p.stock[Warehouse.TNC];
                    return `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${p.sku}</td>
                        <td>${p.name}</td>
                        <td class="text-center">${p.unit}</td>
                        <td class="text-center">${p.stock[Warehouse.TAY_PHAT]}</td>
                        <td class="text-center">${p.stock[Warehouse.TNC]}</td>
                        <td class="text-right">${(totalStock * p.costPrice).toLocaleString()}</td>
                    </tr>
                    `
                }).join('')}
            </tbody>
        </table>
        <div class="footer">
            <div><strong>Người lập biểu</strong></div>
            <div><strong>Thủ kho</strong></div>
            <div><strong>Giám đốc</strong></div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
    `;
};

export const generateCustomerListHTML = (customers: Customer[], settings: SystemSettings) => {
    return `
    <!DOCTYPE html>
    <html>
    <head><title>Danh sách khách hàng</title><style>${getBaseStyles()}</style></head>
    <body>
        ${getCompanyHeader(settings)}
        <div class="header">
            <div class="report-title">DANH SÁCH KHÁCH HÀNG & CÔNG NỢ</div>
            <div class="meta">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%">STT</th>
                    <th style="width: 25%">Tên Khách hàng</th>
                    <th style="width: 15%">Điện thoại</th>
                    <th style="width: 35%">Địa chỉ</th>
                    <th style="width: 20%">Dư nợ hiện tại</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map((c, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${c.name}</td>
                    <td class="text-center">${c.phone}</td>
                    <td>${c.address}</td>
                    <td class="text-right">${c.totalDebt.toLocaleString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
    `;
};

export const generateDetailedDebtHTML = (customer: Customer, invoices: Invoice[], settings: SystemSettings) => {
    const unpaidInvoices = invoices.filter(inv => inv.customerId === customer.id && inv.status !== 'CANCELLED' && inv.status !== 'PAID');
    const totalPending = unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

    return `
    <!DOCTYPE html>
    <html>
    <head><title>Đối chiếu công nợ</title><style>${getBaseStyles()}</style></head>
    <body>
        ${getCompanyHeader(settings)}
        <div class="header">
            <div class="report-title">BẢNG ĐỐI CHIẾU CÔNG NỢ KHÁCH HÀNG</div>
            <div class="meta">Tính đến ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc;">
            <p><strong>Khách hàng:</strong> ${customer.name}</p>
            <p><strong>Điện thoại:</strong> ${customer.phone}</p>
            <p><strong>Địa chỉ:</strong> ${customer.address}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Ngày</th>
                    <th>Số chứng từ</th>
                    <th>Nội dung</th>
                    <th>Tổng tiền</th>
                    <th>Đã thanh toán</th>
                    <th>Còn lại</th>
                </tr>
            </thead>
            <tbody>
                ${unpaidInvoices.map(inv => `
                <tr>
                    <td class="text-center">${new Date(inv.date).toLocaleDateString('vi-VN')}</td>
                    <td class="text-center">${inv.id}</td>
                    <td>Mua hàng/Dịch vụ (SL: ${inv.items.length})</td>
                    <td class="text-right">${inv.totalAmount.toLocaleString()}</td>
                    <td class="text-right">${inv.paidAmount.toLocaleString()}</td>
                    <td class="text-right font-bold">${(inv.totalAmount - inv.paidAmount).toLocaleString()}</td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="background-color: #f9f9f9;">
                    <td colspan="5" class="text-right"><strong>TỔNG CỘNG PHẢI THANH TOÁN:</strong></td>
                    <td class="text-right"><strong>${totalPending.toLocaleString()}</strong></td>
                </tr>
            </tfoot>
        </table>

        <p>Kính mong Quý khách hàng kiểm tra và thanh toán số tiền nợ trên.</p>
        
        <div class="footer">
            <div><strong>Khách hàng</strong><br/>(Ký, họ tên)</div>
            <div></div>
            <div><strong>Kế toán công nợ</strong><br/>(Ký, họ tên)</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
    `;
};
