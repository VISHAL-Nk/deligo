// Base Email Layout Component
// A reusable wrapper for all Deligo email templates

interface BaseLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

// Deligo brand colors
export const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#7c3aed',
  success: '#16a34a',
  warning: '#ea580c',
  error: '#dc2626',
  text: '#1f2937',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  border: '#e5e7eb',
};

// Generate base email HTML wrapper
export function generateEmailHtml(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Deligo</title>
  ${previewText ? `<meta name="description" content="${previewText}">` : ''}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
    }
    a {
      color: ${colors.primary};
    }
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 10px !important;
      }
      .content {
        padding: 20px !important;
      }
      .button {
        width: 100% !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ''}
  
  <!-- Main Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 15px 30px; border-radius: 50px;">
                    <span style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">🛍️ Deligo</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.card}; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <tr>
                  <td class="content" style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <a href="#" style="display: inline-block; margin: 0 10px; color: ${colors.textLight}; text-decoration: none; font-size: 14px;">Help Center</a>
                    <a href="#" style="display: inline-block; margin: 0 10px; color: ${colors.textLight}; text-decoration: none; font-size: 14px;">Privacy Policy</a>
                    <a href="#" style="display: inline-block; margin: 0 10px; color: ${colors.textLight}; text-decoration: none; font-size: 14px;">Terms of Service</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color: ${colors.textLight}; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Deligo. All rights reserved.</p>
                    <p style="margin: 5px 0 0 0;">Your trusted online marketplace for quality products.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Reusable components
export const button = (text: string, href: string, color: string = colors.primary): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
    <tr>
      <td align="center" style="background-color: ${color}; border-radius: 8px;">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

export const heading = (text: string, size: 'h1' | 'h2' | 'h3' = 'h1'): string => {
  const styles = {
    h1: 'font-size: 24px; font-weight: 700; margin: 0 0 20px 0;',
    h2: 'font-size: 20px; font-weight: 600; margin: 20px 0 15px 0;',
    h3: 'font-size: 16px; font-weight: 600; margin: 15px 0 10px 0;',
  };
  return `<p style="color: ${colors.text}; ${styles[size]}">${text}</p>`;
};

export const paragraph = (text: string): string => `
  <p style="color: ${colors.text}; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
    ${text}
  </p>
`;

export const mutedText = (text: string): string => `
  <p style="color: ${colors.textLight}; font-size: 13px; line-height: 1.5; margin: 10px 0;">
    ${text}
  </p>
`;

export const divider = (): string => `
  <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 25px 0;">
`;

export const badge = (text: string, color: string): string => `
  <span style="display: inline-block; padding: 6px 12px; background-color: ${color}20; color: ${color}; font-size: 12px; font-weight: 600; border-radius: 20px; text-transform: uppercase;">
    ${text}
  </span>
`;
