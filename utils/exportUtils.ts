
export const exportToCSV = (data: any[], headers: string[], keys: string[], filename: string) => {
    if (!data || !data.length) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    // Create CSV content
    // Add BOM for UTF-8 support in Excel
    const BOM = "\uFEFF"; 
    
    const headerRow = headers.join(",");
    const rows = data.map(row => {
        return keys.map(key => {
            let val = row[key] === null || row[key] === undefined ? '' : row[key];
            // Escape quotes and wrap in quotes if contains comma
            val = String(val).replace(/"/g, '""');
            if (val.search(/("|,|\n)/g) >= 0) {
                val = `"${val}"`;
            }
            return val;
        }).join(",");
    });

    const csvContent = BOM + [headerRow, ...rows].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
