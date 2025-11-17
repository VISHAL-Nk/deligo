import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Orders.models';
import Product from '@/models/Products.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import Payout from '@/models/Payouts.models';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateInvoicePDF, generateSalesReportPDF, generatePayoutReportPDF } from '@/lib/pdf-generator';
import { exportSalesReportCSV, exportProductsCSV, exportPayoutsCSV } from '@/lib/csv-excel-utils';

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const { type, format, orderId, startDate, endDate } = await req.json();

    if (type === 'invoice' && orderId) {
      // Generate invoice for specific order
      const order = await Order.findOne({
        _id: orderId,
        sellerId: sellerProfile._id,
      })
        .populate('userId', 'name email phone')
        .populate('items.productId', 'name price');

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const invoiceData = {
        orderId: order._id.toString(),
        orderDate: order.createdAt,
        customer: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (order.userId as any).name || 'Customer',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email: (order.userId as any).email || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          phone: (order.userId as any).phone || '',
        },
        shippingAddress: order.shippingAddress || {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: order.items.map((item: any) => ({
          name: item.productId.name,
          quantity: item.quantity,
          price: item.productId.price,
          total: item.quantity * item.productId.price,
        })),
        subtotal: order.totalAmount - order.taxAmount - order.shippingFee + order.discountAmount,
        tax: order.taxAmount,
        discount: order.discountAmount,
        shippingFee: order.shippingFee,
        total: order.totalAmount,
        seller: {
          businessName: sellerProfile.businessName,
          gstNumber: sellerProfile.gstNumber,
          address: sellerProfile.store[0]?.address || '',
        },
      };

      const pdf = generateInvoicePDF(invoiceData);
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
        },
      });
    }

    if (type === 'sales') {
      const query: Record<string, unknown> = { sellerId: sellerProfile._id };
      if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      const orders = await Order.find(query)
        .populate('userId', 'name email')
        .populate('items.productId', 'name')
        .lean();

      if (format === 'csv') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const salesData = orders.map((order: any) => ({
          orderId: order._id.toString(),
          date: order.createdAt,
          customer: order.userId?.name || 'N/A',
          items: order.items.length,
          total: order.totalAmount,
          status: order.status,
        }));

        const csvBlob = exportSalesReportCSV(salesData);
        const csvBuffer = Buffer.from(await csvBlob.arrayBuffer());

        return new NextResponse(csvBuffer, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="sales-report.csv"',
          },
        });
      } else {
        // PDF format
        const reportData = {
          period: startDate && endDate 
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'All Time',
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          totalProducts: orders.reduce((sum, order) => sum + order.items.length, 0),
          topProducts: [], // You can calculate this
          seller: {
            businessName: sellerProfile.businessName,
          },
        };

        const pdf = generateSalesReportPDF(reportData);
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="sales-report.pdf"',
          },
        });
      }
    }

    if (type === 'products' && format === 'csv') {
      const products = await Product.find({ sellerId: sellerProfile._id })
        .populate('categoryId', 'name')
        .lean();

      const productData = products.map(product => ({
        sku: product.sku,
        name: product.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: (product.categoryId as any)?.name || 'N/A',
        price: product.price,
        stock: product.stock,
        status: product.status,
      }));

      const csvBlob = exportProductsCSV(productData);
      const csvBuffer = Buffer.from(await csvBlob.arrayBuffer());

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="products.csv"',
        },
      });
    }

    if (type === 'payouts') {
      const query: Record<string, unknown> = { sellerId: sellerProfile._id };
      if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      const payouts = await Payout.find(query).populate('orderId').lean();

      if (format === 'csv') {
        const payoutData = payouts.map(payout => ({
          orderId: payout.orderId.toString(),
          date: payout.createdAt,
          amount: payout.amount,
          commission: payout.platformCommission,
          netAmount: payout.netAmount,
          status: payout.status,
        }));

        const csvBlob = exportPayoutsCSV(payoutData);
        const csvBuffer = Buffer.from(await csvBlob.arrayBuffer());

        return new NextResponse(csvBuffer, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="payouts.csv"',
          },
        });
      } else {
        const reportData = {
          period: startDate && endDate 
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'All Time',
          payouts: payouts.map(p => ({
            orderId: p.orderId.toString(),
            date: p.createdAt,
            amount: p.amount,
            commission: p.platformCommission,
            netAmount: p.netAmount,
            status: p.status,
          })),
          totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
          totalCommission: payouts.reduce((sum, p) => sum + p.platformCommission, 0),
          totalNetAmount: payouts.reduce((sum, p) => sum + p.netAmount, 0),
          seller: {
            businessName: sellerProfile.businessName,
          },
        };

        const pdf = generatePayoutReportPDF(reportData);
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="payout-report.pdf"',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Invalid report type or format' }, { status: 400 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
