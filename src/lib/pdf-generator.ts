import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Generate Invoice PDF for an order
 */
export function generateInvoicePDF(orderData: {
  orderId: string;
  orderDate: Date;
  customer: { name: string; email: string; phone: string };
  shippingAddress: ShippingAddress;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
  subtotal: number;
  tax: number;
  discount: number;
  shippingFee: number;
  total: number;
  seller: { businessName: string; gstNumber?: string; address: string };
}): jsPDF {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });

  // Seller Details
  doc.setFontSize(10);
  doc.text(`From: ${orderData.seller.businessName}`, 20, 35);
  doc.text(orderData.seller.address, 20, 40);
  if (orderData.seller.gstNumber) {
    doc.text(`GST: ${orderData.seller.gstNumber}`, 20, 45);
  }

  // Customer Details
  doc.text(`To: ${orderData.customer.name}`, 20, 60);
  doc.text(`Email: ${orderData.customer.email}`, 20, 65);
  doc.text(`Phone: ${orderData.customer.phone}`, 20, 70);

  // Order Details
  doc.text(`Invoice #: ${orderData.orderId}`, 120, 60);
  doc.text(`Date: ${new Date(orderData.orderDate).toLocaleDateString()}`, 120, 65);

  // Items Table
  autoTable(doc, {
    startY: 85,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: orderData.items.map(item => [
      item.name,
      item.quantity.toString(),
      `₹${item.price.toFixed(2)}`,
      `₹${item.total.toFixed(2)}`,
    ]),
    theme: 'grid',
  });

  // Summary
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 85;
  doc.text(`Subtotal: ₹${orderData.subtotal.toFixed(2)}`, 140, finalY + 10);
  doc.text(`Tax: ₹${orderData.tax.toFixed(2)}`, 140, finalY + 15);
  doc.text(`Discount: -₹${orderData.discount.toFixed(2)}`, 140, finalY + 20);
  doc.text(`Shipping: ₹${orderData.shippingFee.toFixed(2)}`, 140, finalY + 25);
  doc.setFontSize(12);
  doc.text(`Total: ₹${orderData.total.toFixed(2)}`, 140, finalY + 35);

  return doc;
}

/**
 * Generate Sales Report PDF
 */
export function generateSalesReportPDF(reportData: {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  topProducts: Array<{ name: string; orders: number; revenue: number }>;
  seller: { businessName: string };
}): jsPDF {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('Sales Report', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Seller: ${reportData.seller.businessName}`, 20, 35);
  doc.text(`Period: ${reportData.period}`, 20, 40);

  // Summary
  doc.setFontSize(12);
  doc.text('Summary', 20, 55);
  doc.setFontSize(10);
  doc.text(`Total Orders: ${reportData.totalOrders}`, 20, 65);
  doc.text(`Total Revenue: ₹${reportData.totalRevenue.toFixed(2)}`, 20, 70);
  doc.text(`Total Products Sold: ${reportData.totalProducts}`, 20, 75);

  // Top Products Table
  if (reportData.topProducts.length > 0) {
    autoTable(doc, {
      startY: 85,
      head: [['Product', 'Orders', 'Revenue']],
      body: reportData.topProducts.map(product => [
        product.name,
        product.orders.toString(),
        `₹${product.revenue.toFixed(2)}`,
      ]),
      theme: 'grid',
    });
  }

  return doc;
}

/**
 * Generate Payout Report PDF
 */
export function generatePayoutReportPDF(payoutData: {
  period: string;
  payouts: Array<{
    orderId: string;
    date: Date;
    amount: number;
    commission: number;
    netAmount: number;
    status: string;
  }>;
  totalAmount: number;
  totalCommission: number;
  totalNetAmount: number;
  seller: { businessName: string };
}): jsPDF {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('Payout Report', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Seller: ${payoutData.seller.businessName}`, 20, 35);
  doc.text(`Period: ${payoutData.period}`, 20, 40);

  // Payouts Table
  autoTable(doc, {
    startY: 50,
    head: [['Order ID', 'Date', 'Amount', 'Commission', 'Net Amount', 'Status']],
    body: payoutData.payouts.map(payout => [
      payout.orderId.substring(0, 8),
      new Date(payout.date).toLocaleDateString(),
      `₹${payout.amount.toFixed(2)}`,
      `₹${payout.commission.toFixed(2)}`,
      `₹${payout.netAmount.toFixed(2)}`,
      payout.status,
    ]),
    theme: 'grid',
  });

  // Summary
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 50;
  doc.setFontSize(12);
  doc.text('Summary', 20, finalY + 15);
  doc.setFontSize(10);
  doc.text(`Total Amount: ₹${payoutData.totalAmount.toFixed(2)}`, 20, finalY + 25);
  doc.text(`Total Commission: ₹${payoutData.totalCommission.toFixed(2)}`, 20, finalY + 30);
  doc.text(`Total Net Amount: ₹${payoutData.totalNetAmount.toFixed(2)}`, 20, finalY + 35);

  return doc;
}
