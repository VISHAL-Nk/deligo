// Email Verification Template
import { generateEmailHtml, button, heading, paragraph, mutedText, divider, colors } from './base-layout';

interface VerificationEmailProps {
  userName?: string;
  verificationUrl: string;
  expiresIn?: string;
}

export function generateVerificationEmail({ 
  userName, 
  verificationUrl, 
  expiresIn = '24 hours' 
}: VerificationEmailProps): string {
  const content = `
    <!-- Icon -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; width: 70px; height: 70px; background: linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%); border-radius: 50%; line-height: 70px; font-size: 32px;">
        ✉️
      </div>
    </div>
    
    ${heading('Verify Your Email Address', 'h1')}
    
    ${paragraph(`Hi${userName ? ` <strong>${userName}</strong>` : ''},`)}
    
    ${paragraph(`Welcome to Deligo! We're excited to have you on board. To get started, please verify your email address by clicking the button below.`)}
    
    <div style="text-align: center;">
      ${button('✓ Verify Email Address', verificationUrl)}
    </div>
    
    ${mutedText(`This link will expire in ${expiresIn}. If you didn't create an account with Deligo, you can safely ignore this email.`)}
    
    ${divider()}
    
    <p style="color: ${colors.textLight}; font-size: 13px; margin: 0;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
      <a href="${verificationUrl}" style="color: ${colors.primary};">${verificationUrl}</a>
    </p>
  `;

  return generateEmailHtml(content, 'Verify your email address to get started with Deligo');
}
