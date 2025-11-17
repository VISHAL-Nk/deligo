import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Convert data to CSV format
 */
export function generateCSV(data: Record<string, unknown>[]): Blob {
  const csv = Papa.unparse(data);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Convert data to Excel format
 */
export function generateExcel(data: Record<string, unknown>[]): Blob {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Parse CSV file to JSON
 */
export function parseCSV(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results.data as Record<string, unknown>[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Parse Excel file to JSON
 */
export function parseExcel(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData as Record<string, unknown>[]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download file in browser
 */
export function downloadFile(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export sales report as CSV
 */
export function exportSalesReportCSV(salesData: Array<{
  orderId: string;
  date: Date;
  customer: string;
  items: number;
  total: number;
  status: string;
}>): Blob {
  const formattedData = salesData.map(sale => ({
    'Order ID': sale.orderId,
    'Date': new Date(sale.date).toLocaleDateString(),
    'Customer': sale.customer,
    'Items': sale.items,
    'Total': `₹${sale.total.toFixed(2)}`,
    'Status': sale.status,
  }));
  
  return generateCSV(formattedData);
}

/**
 * Export product list as CSV
 */
export function exportProductsCSV(products: Array<{
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
}>): Blob {
  const formattedData = products.map(product => ({
    'SKU': product.sku,
    'Name': product.name,
    'Category': product.category,
    'Price': product.price,
    'Stock': product.stock,
    'Status': product.status,
  }));
  
  return generateCSV(formattedData);
}

/**
 * Export payout report as CSV
 */
export function exportPayoutsCSV(payouts: Array<{
  orderId: string;
  date: Date;
  amount: number;
  commission: number;
  netAmount: number;
  status: string;
}>): Blob {
  const formattedData = payouts.map(payout => ({
    'Order ID': payout.orderId,
    'Date': new Date(payout.date).toLocaleDateString(),
    'Amount': `₹${payout.amount.toFixed(2)}`,
    'Commission': `₹${payout.commission.toFixed(2)}`,
    'Net Amount': `₹${payout.netAmount.toFixed(2)}`,
    'Status': payout.status,
  }));
  
  return generateCSV(formattedData);
}
