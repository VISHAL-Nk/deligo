// Shipping Update Email Template
import { generateEmailHtml, button, heading, paragraph, mutedText, divider, colors } from './base-layout';

type ShippingStatus = 'confirmed' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered';

interface ShippingUpdateEmailProps {
  userName?: string;
  orderId: string;
  status: ShippingStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedDelivery?: string;
  deliveredAt?: Date;
}

const statusConfig: Record<ShippingStatus, { icon: string; title: string; description: string; color: string }> = {
  'confirmed': {
    icon: '✓',
    title: 'Order Confirmed',
    description: 'Your order has been confirmed and is being prepared.',
    color: colors.primary,
  },
  'packed': {
    icon: '📦',
    title: 'Order Packed',
    description: 'Your order has been packed and is ready for shipping.',
    color: colors.secondary,
  },
  'shipped': {
    icon: '🚚',
    title: 'Order Shipped',
    description: 'Your order is on its way! Track your package using the details below.',
    color: colors.warning,
  },
  'out-for-delivery': {
    icon: '🏃',
    title: 'Out for Delivery',
    description: 'Great news! Your order is out for delivery and will arrive today.',
    color: colors.success,
  },
  'delivered': {
    icon: '🎉',
    title: 'Delivered!',
    description: 'Your order has been delivered successfully.',
    color: colors.success,
  },
};

function generateTimeline(currentStatus: ShippingStatus): string {
  const statuses: ShippingStatus[] = ['confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered'];
  const currentIndex = statuses.indexOf(currentStatus);

  const steps = statuses.map((status, index) => {
    const config = statusConfig[status];
    const isCompleted = index <= currentIndex;
    const isCurrent = index === currentIndex;
    
    return `
      <tr>
        <td style="padding: 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="40" style="vertical-align: top; padding-right: 15px;">
                <!-- Circle -->
                <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${isCompleted ? config.color : colors.border}; text-align: center; line-height: 32px; font-size: 14px;">
                  ${isCompleted ? (isCurrent ? config.icon : '✓') : ''}
                </div>
                ${index < statuses.length - 1 ? `
                  <!-- Line -->
                  <div style="width: 2px; height: 30px; background-color: ${index < currentIndex ? colors.success : colors.border}; margin: 5px auto;"></div>
                ` : ''}
              </td>
              <td style="vertical-align: top; padding-bottom: ${index < statuses.length - 1 ? '20px' : '0'};">
                <p style="margin: 0; font-weight: ${isCurrent ? '700' : '500'}; color: ${isCompleted ? colors.text : colors.textLight}; font-size: 14px;">
                  ${config.title}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
      ${steps}
    </table>
  `;
}

export function generateShippingUpdateEmail({
  userName,
  orderId,
  status,
  trackingNumber,
  trackingUrl,
  driverName,
  driverPhone,
  estimatedDelivery,
  deliveredAt
}: ShippingUpdateEmailProps): string {
  const config = statusConfig[status];

  const content = `
    <!-- Status Icon -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; width: 70px; height: 70px; background-color: ${config.color}20; border-radius: 50%; line-height: 70px; font-size: 32px;">
        ${config.icon}
      </div>
    </div>
    
    ${heading(config.title, 'h1')}
    
    ${paragraph(`Hi${userName ? ` <strong>${userName}</strong>` : ''}, ${config.description}`)}
    
    <!-- Order ID Badge -->
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; padding: 8px 16px; background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 14px; color: ${colors.text};">
        Order ID: <strong>${orderId}</strong>
      </span>
    </div>
    
    ${divider()}
    
    ${heading('Delivery Progress', 'h2')}
    
    ${generateTimeline(status)}
    
    ${trackingNumber || driverName || estimatedDelivery ? `
      ${divider()}
      
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.background}; border-radius: 8px;">
        <tr>
          <td style="padding: 20px;">
            ${trackingNumber ? `
              <p style="margin: 0 0 10px 0; color: ${colors.textLight}; font-size: 12px; text-transform: uppercase;">Tracking Number</p>
              <p style="margin: 0 0 15px 0; color: ${colors.text}; font-size: 16px; font-weight: 600;">${trackingNumber}</p>
            ` : ''}
            
            ${driverName ? `
              <p style="margin: 0 0 10px 0; color: ${colors.textLight}; font-size: 12px; text-transform: uppercase;">Delivery Partner</p>
              <p style="margin: 0 0 15px 0; color: ${colors.text}; font-size: 14px;">
                👤 ${driverName}${driverPhone ? ` • 📞 ${driverPhone}` : ''}
              </p>
            ` : ''}
            
            ${estimatedDelivery && status !== 'delivered' ? `
              <p style="margin: 0 0 10px 0; color: ${colors.textLight}; font-size: 12px; text-transform: uppercase;">Estimated Delivery</p>
              <p style="margin: 0; color: ${colors.success}; font-size: 14px; font-weight: 600;">🚚 ${estimatedDelivery}</p>
            ` : ''}
            
            ${deliveredAt && status === 'delivered' ? `
              <p style="margin: 0 0 10px 0; color: ${colors.textLight}; font-size: 12px; text-transform: uppercase;">Delivered On</p>
              <p style="margin: 0; color: ${colors.success}; font-size: 14px; font-weight: 600;">
                ✅ ${deliveredAt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            ` : ''}
          </td>
        </tr>
      </table>
    ` : ''}
    
    ${trackingUrl ? `
      <div style="text-align: center;">
        ${button('Track Your Order', trackingUrl)}
      </div>
    ` : ''}
    
    ${status === 'delivered' ? `
      ${divider()}
      ${paragraph('We hope you love your purchase! If you have any questions or concerns, please don\'t hesitate to contact our support team.')}
    ` : ''}
  `;

  return generateEmailHtml(content, `Shipping Update: ${config.title} - Order #${orderId}`);
}
