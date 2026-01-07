import nodemailer from "nodemailer";
import { generateVerificationEmail } from "./email-templates/verification";
import { generateOrderConfirmationEmail } from "./email-templates/order-confirmation";
import { generateShippingUpdateEmail } from "./email-templates/shipping-update";
import { generateWelcomeEmail } from "./email-templates/welcome";

// Create reusable transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Send email verification
export async function sendVerificationEmail(email: string, token: string, userName?: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const html = generateVerificationEmail({
    userName,
    verificationUrl,
    expiresIn: '24 hours'
  });

  const transporter = createTransporter();
  
  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email - Deligo",
    html,
  });
}

// Send order confirmation with OTP
export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  otpCode: string,
  orderDetails: {
    userName?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  }
) {
  const html = generateOrderConfirmationEmail({
    userName: orderDetails.userName,
    orderId,
    otpCode,
    items: orderDetails.items,
    totalAmount: orderDetails.totalAmount,
    shippingAddress: orderDetails.shippingAddress,
    orderDate: new Date(),
    estimatedDelivery: '3-5 business days'
  });

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html,
  });
}

// Send shipping status update
export async function sendShippingUpdateEmail(
  email: string,
  orderId: string,
  shippingDetails: {
    userName?: string;
    status: 'confirmed' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered';
    trackingNumber?: string;
    trackingUrl?: string;
    driverName?: string;
    driverPhone?: string;
    estimatedDelivery?: string;
    deliveredAt?: Date;
  }
) {
  const html = generateShippingUpdateEmail({
    userName: shippingDetails.userName,
    orderId,
    status: shippingDetails.status,
    trackingNumber: shippingDetails.trackingNumber,
    trackingUrl: shippingDetails.trackingUrl,
    driverName: shippingDetails.driverName,
    driverPhone: shippingDetails.driverPhone,
    estimatedDelivery: shippingDetails.estimatedDelivery,
    deliveredAt: shippingDetails.deliveredAt,
  });

  const transporter = createTransporter();

  const statusTitles: Record<typeof shippingDetails.status, string> = {
    'confirmed': 'Order Confirmed',
    'packed': 'Order Packed',
    'shipped': 'Order Shipped',
    'out-for-delivery': 'Out for Delivery',
    'delivered': 'Order Delivered',
  };

  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${statusTitles[shippingDetails.status]} - Order #${orderId}`,
    html,
  });
}

// Send welcome email
export async function sendWelcomeEmail(email: string, userName: string) {
  const html = generateWelcomeEmail({
    userName,
    browseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  });

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome to Deligo, ${userName}! 🎉`,
    html,
  });
}
