// Order Confirmation Email Template
import { generateEmailHtml, button, heading, paragraph, mutedText, divider, colors, badge } from './base-layout';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderConfirmationEmailProps {
  userName?: string;
  orderId: string;
  otpCode: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  orderDate?: Date;
  estimatedDelivery?: string;
}

export function generateOrderConfirmationEmail({
  userName,
  orderId,
  otpCode,
  items,
  totalAmount,
  shippingAddress,
  orderDate = new Date(),
  estimatedDelivery = '3-5 business days'
}: OrderConfirmationEmailProps): string {
  
  // Generate order items table
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align: middle;">
              <p style="margin: 0; font-weight: 600; color: ${colors.text}; font-size: 14px;">${item.name}</p>
              <p style="margin: 5px 0 0 0; color: ${colors.textLight}; font-size: 13px;">Qty: ${item.quantity}</p>
            </td>
            <td align="right" style="vertical-align: middle;">
              <p style="margin: 0; font-weight: 600; color: ${colors.text}; font-size: 14px;">₹${(item.price * item.quantity).toLocaleString()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Success Icon -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; width: 70px; height: 70px; background-color: ${colors.success}20; border-radius: 50%; line-height: 70px; font-size: 32px;">
        ✅
      </div>
    </div>
    
    ${heading('Order Confirmed!', 'h1')}
    
    ${paragraph(`Hi${userName ? ` <strong>${userName}</strong>` : ''}, thank you for your order! We're preparing your items and will notify you when they ship.`)}
    
    <!-- Order ID Badge -->
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; padding: 8px 16px; background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 14px; color: ${colors.text};">
        Order ID: <strong>${orderId}</strong>
      </span>
    </div>
    
    ${divider()}
    
    <!-- Delivery OTP Section -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.primary}10 0%, ${colors.secondary}10 100%); border-radius: 12px; margin: 20px 0; border: 2px dashed ${colors.primary}40;">
      <tr>
        <td style="padding: 25px; text-align: center;">
          <p style="margin: 0 0 10px 0; color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your Delivery OTP</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${colors.primary}; letter-spacing: 8px;">${otpCode}</p>
          <p style="margin: 15px 0 0 0; color: ${colors.text}; font-size: 13px;">Share this code with the delivery person when they arrive</p>
        </td>
      </tr>
    </table>
    
    ${divider()}
    
    ${heading('Order Summary', 'h2')}
    
    <!-- Items Table -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${itemsHtml}
      <tr>
        <td style="padding: 15px 0 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: ${colors.text};">Total</td>
              <td align="right" style="font-size: 18px; font-weight: 700; color: ${colors.primary};">₹${totalAmount.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${divider()}
    
    ${heading('Shipping Address', 'h2')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 15px;">
          <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.6;">
            📍 ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.zipCode}
          </p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
      <tr>
        <td style="padding: 12px 15px; background-color: ${colors.success}10; border-radius: 8px; border-left: 4px solid ${colors.success};">
          <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
            🚚 <strong>Estimated Delivery:</strong> ${estimatedDelivery}
          </p>
        </td>
      </tr>
    </table>
    
    ${mutedText(`Order placed on ${orderDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)}
  `;

  return generateEmailHtml(content, `Your order #${orderId} has been confirmed! Delivery OTP: ${otpCode}`);
}
