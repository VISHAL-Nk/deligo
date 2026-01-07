// Welcome Email Template
import { generateEmailHtml, button, heading, paragraph, mutedText, divider, colors } from './base-layout';

interface WelcomeEmailProps {
  userName: string;
  browseUrl?: string;
}

export function generateWelcomeEmail({ 
  userName, 
  browseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}: WelcomeEmailProps): string {
  
  const features = [
    {
      icon: '🛍️',
      title: 'Wide Product Range',
      description: 'Explore thousands of products from verified sellers',
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Get your orders delivered quickly to your doorstep',
    },
    {
      icon: '🔒',
      title: 'Secure Payments',
      description: 'Pay safely with our encrypted payment gateway',
    },
    {
      icon: '↩️',
      title: 'Easy Returns',
      description: 'Hassle-free returns within the return window',
    },
  ];

  const featuresHtml = features.map(feature => `
    <tr>
      <td style="padding: 15px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="50" style="vertical-align: top;">
              <div style="width: 44px; height: 44px; background-color: ${colors.primary}10; border-radius: 10px; text-align: center; line-height: 44px; font-size: 22px;">
                ${feature.icon}
              </div>
            </td>
            <td style="vertical-align: top; padding-left: 15px;">
              <p style="margin: 0; font-weight: 600; color: ${colors.text}; font-size: 15px;">${feature.title}</p>
              <p style="margin: 5px 0 0 0; color: ${colors.textLight}; font-size: 13px;">${feature.description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Welcome Icon -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
        🎉
      </div>
    </div>
    
    ${heading(`Welcome to Deligo, ${userName}!`, 'h1')}
    
    ${paragraph(`We're thrilled to have you as part of the Deligo family! Your account is all set up and ready to go. Get ready to discover amazing products at great prices.`)}
    
    <div style="text-align: center;">
      ${button('🛒 Start Shopping', browseUrl)}
    </div>
    
    ${divider()}
    
    ${heading('Why You\'ll Love Deligo', 'h2')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${featuresHtml}
    </table>
    
    ${divider()}
    
    <!-- Quick Tips -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.primary}05 0%, ${colors.secondary}05 100%); border-radius: 12px;">
      <tr>
        <td style="padding: 20px;">
          ${heading('💡 Getting Started Tips', 'h3')}
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: ${colors.text}; font-size: 14px; line-height: 1.8;">
            <li>Complete your profile to get personalized recommendations</li>
            <li>Add products to your wishlist to save them for later</li>
            <li>Follow your favorite sellers to stay updated on new arrivals</li>
            <li>Enable notifications to never miss a deal</li>
          </ul>
        </td>
      </tr>
    </table>
    
    ${mutedText('If you have any questions, our support team is here to help 24/7.')}
  `;

  return generateEmailHtml(content, `Welcome to Deligo, ${userName}! Your shopping journey begins now.`);
}
